/**
 * Google Apps Script for SIMATS Certificate Sharing Portal (Advanced Enterprise Edition)
 * 
 * Main Features:
 * 1. Thread-safe operations using LockService.
 * 2. Automated Activity Logs sheet with self-pruning logic.
 * 3. Dynamic email templating with custom subject/body support.
 * 4. Automatic spreadsheet schema configuration, frozen headers, and dropdown validations.
 * 5. Detailed diagnostic actions and remaining daily quota safety assertions.
 * 
 * Deployment Instructions:
 * 1. Open your target Google Sheet. Create or verify a sheet named "Registrations".
 * 2. Click Extensions -> Apps Script.
 * 3. Delete any code in the editor and paste this code.
 * 4. SELECT "testEmailAuthorization" from the function dropdown at the top, and click "Run".
 * 5. Provide Google authorization permissions when prompted (Advanced -> Go to unsafe).
 * 6. Click "Deploy" -> "New deployment". Select "Web app".
 * 7. Execute as: "Me" (your email), Who has access: "Anyone".
 * 8. Deploy and copy the Web App URL into the portal dashboard.
 */

// Global Configurations
const REGISTER_SHEET_NAME = "Registrations";
const LOG_SHEET_NAME = "ActivityLogs";
const REGISTRATION_HEADERS = ["Team Name", "College", "Leader Name", "Leader Email", "Leader Phone", "Members", "Timestamp", "certificate status"];
const LOG_HEADERS = ["Timestamp", "Action", "Email / Recipient", "Team Name", "Details", "Status"];

/**
 * Run this function FIRST to authorize the MailApp API permissions.
 */
function testEmailAuthorization() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let remaining = -1;
  try {
    remaining = MailApp.getRemainingDailyQuota();
    console.log("✅ MailApp is authorized! Remaining daily emails: " + remaining);
    logActivity(ss, "Diagnostics", Session.getActiveUser().getEmail(), "System Test", "Authorization test successful. Quota: " + remaining, false);
  } catch (err) {
    console.error("❌ MailApp authorization failed: " + err.toString());
    try {
      logActivity(ss, "Diagnostics", Session.getActiveUser().getEmail(), "System Test", "Authorization test failed: " + err.toString(), true);
    } catch(e) {}
    return;
  }
  
  try {
    MailApp.sendEmail({
      to: Session.getActiveUser().getEmail(),
      subject: "SYNORA'26 Portal - Google Apps Script Authorization Test",
      body: "Hello,\n\nIf you received this, your email permissions are working correctly.\n\nRemaining Daily Quota: " + remaining + "\n\nBest regards,\nSIMATS Portal Backend."
    });
    console.log("✅ Diagnostic verification email sent to: " + Session.getActiveUser().getEmail());
  } catch (err) {
    console.error("❌ Failed to send diagnostic email: " + err.toString());
  }
}

/**
 * Handle GET Requests
 * Retrieves data rows, stats, and diagnostic activity logs.
 */
function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Success: Apps Script is connected! Use the Web App URL inside your HTML portal to send requests.");
  }
  
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'get') {
    let sheet = ss.getSheetByName(REGISTER_SHEET_NAME);
    if (!sheet && ss.getSheets().length > 0) {
      sheet = ss.getSheets()[0]; // Fallback to first sheet
    }
    
    const data = [];
    let emailedCount = 0;
    let registeredCount = 0;
    
    if (sheet) {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const teamName = row[0] ? row[0].toString().trim() : "";
        if (!teamName) continue;
        
        const status = row[7] ? row[7].toString().trim() : "Registered";
        if (status.toLowerCase() === "emailed") {
          emailedCount++;
        } else {
          registeredCount++;
        }
        
        data.push({
          teamName: teamName,
          college: row[1] ? row[1].toString().trim() : "",
          leaderName: row[2] ? row[2].toString().trim() : "",
          leaderEmail: row[3] ? row[3].toString().trim() : "",
          leaderPhone: row[4] ? row[4].toString().trim() : "",
          members: row[5] ? row[5].toString().split(',').map(m => m.trim()) : [],
          status: status
        });
      }
    }
    
    let quota = -1;
    try {
      quota = MailApp.getRemainingDailyQuota();
    } catch (qErr) {
      console.warn("Could not retrieve remaining daily quota: " + qErr.toString());
    }
    
    const logs = [];
    try {
      const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
      if (logSheet) {
        const logRows = logSheet.getDataRange().getValues();
        const startIdx = Math.max(1, logRows.length - 15); // Get last 15 entries
        for (let i = startIdx; i < logRows.length; i++) {
          logs.push({
            timestamp: logRows[i][0],
            action: logRows[i][1],
            email: logRows[i][2],
            teamName: logRows[i][3],
            details: logRows[i][4],
            status: logRows[i][5]
          });
        }
      }
    } catch (lErr) {
      console.warn("Could not retrieve activity logs: " + lErr.toString());
    }

    const payload = JSON.stringify({
      database: data,
      quota: quota,
      stats: {
        total: data.length,
        emailed: emailedCount,
        pending: registeredCount
      },
      logs: logs
    });
    
    // Support JSONP wrapping to bypass local CORS blocks
    const callback = e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(callback + "(" + payload + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput("Hello from SIMATS Portal Backend");
}

/**
 * Handle POST Requests
 * Thread-safe execution for registration, bulk mailing, status syncs, and deletions.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "No payload received." }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    console.log("📨 Action requested: " + action);
    
    // 1. REGISTRATION OPERATION
    if (action === 'register') {
      const reg = postData.data;
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000); // 10s concurrency wait
      } catch (lockErr) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Write lock timeout. Please retry." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      try {
        const sheet = getOrCreateSheet(ss, REGISTER_SHEET_NAME, REGISTRATION_HEADERS);
        const membersStr = Array.isArray(reg.members) ? reg.members.join(', ') : (reg.members || "");
        
        sheet.appendRow([
          reg.teamName,
          reg.college,
          reg.leaderName,
          reg.leaderEmail,
          reg.leaderPhone,
          membersStr,
          new Date().toISOString(),
          "Registered"
        ]);
        SpreadsheetApp.flush();
        
        logActivity(ss, "Registration", reg.leaderEmail, reg.teamName, "New team registration created.", false);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }
    
    // 2. EMAIL AND ATTACHMENTS OPERATION
    if (action === 'sendEmail') {
      const email = postData.email;
      const leaderName = postData.leaderName;
      const teamName = postData.teamName;
      const attachmentsData = postData.attachments || [];
      const customSubject = postData.subject;
      const customBody = postData.body;
      
      let quota = -1;
      try {
        quota = MailApp.getRemainingDailyQuota();
      } catch (qErr) {}
      
      if (attachmentsData.length > 0 && quota === 0) {
        logActivity(ss, "Email Rejected", email, teamName, "Sending aborted. Quota limit reached.", true);
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "error", 
          message: "Daily email quota limit reached. Cannot send certificates." 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(15000); // Concurrency wait
      } catch (lErr) {
        console.warn("Could not acquire lock: " + lErr.toString());
      }
      
      try {
        const emailAttachments = [];
        let attachmentsBytes = 0;
        
        for (let i = 0; i < attachmentsData.length; i++) {
          const fileData = attachmentsData[i];
          let rawB64 = fileData.base64Data || "";
          
          if (rawB64.indexOf(",") !== -1) {
            rawB64 = rawB64.split(",")[1];
          }
          rawB64 = rawB64.replace(/\s+/g, '');
          
          if (rawB64.length > 0) {
            const decoded = Utilities.base64Decode(rawB64);
            const mime = fileData.mimeType || 'application/pdf';
            const fileName = fileData.name || ('Certificate_' + (i + 1) + '.pdf');
            const blob = Utilities.newBlob(decoded, mime, fileName);
            emailAttachments.push(blob);
            attachmentsBytes += decoded.length;
          }
        }
        
        let emailSent = false;
        if (emailAttachments.length > 0) {
          const subject = customSubject || ("SYNORA'26 Participation Certificates - Team " + teamName);
          const body = customBody || ("Dear " + leaderName + ",\n\n" +
                       "Attached are the participation certificates for your team members of SYNORA'26 conducted by SIMATS Engineering.\n\n" +
                       "Kindly distribute them to the respective team members.\n\n" +
                       "Best regards,\n" +
                       "Department of Medical Biotechnology,\n" +
                       "SIMATS Engineering, Saveetha Institute of Medical And Technical Sciences.");
          
          try {
            MailApp.sendEmail({
              to: email,
              subject: subject,
              body: body,
              attachments: emailAttachments
            });
            emailSent = true;
            logActivity(ss, "Email Sent", email, teamName, "Mailed " + emailAttachments.length + " PDFs (" + (attachmentsBytes / 1024).toFixed(1) + " KB total).", false);
          } catch (mailErr) {
            logActivity(ss, "Email Failure", email, teamName, "API Error: " + mailErr.toString(), true);
            return ContentService.createTextOutput(JSON.stringify({ 
              status: "error", 
              message: "Email dispatch failed: " + mailErr.toString()
            })).setMimeType(ContentService.MimeType.JSON);
          }
        } else {
          logActivity(ss, "Status Update Only", email, teamName, "Updated status dynamically. No attachments sent.", false);
        }
        
        // Update database rows to "Emailed"
        const updatedCount = updateRowStatus(ss, teamName, email, "Emailed");
        
        try {
          quota = MailApp.getRemainingDailyQuota();
        } catch (qErr) {}
  
        return ContentService.createTextOutput(JSON.stringify({ 
          status: "success",
          message: emailSent ? "Email dispatched successfully." : "Status updated.",
          updatedRows: updatedCount,
          quota: quota
        })).setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }
    
    // 3. EXPLICIT STATUS SYNC OPERATION
    if (action === 'updateStatus') {
      const teamName = postData.teamName;
      const email = postData.email;
      const newStatus = postData.status || "Emailed";
      
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (lockErr) {}
      
      try {
        const updatedCount = updateRowStatus(ss, teamName, email, newStatus);
        logActivity(ss, "Status Sync", email, teamName, "Explicit status sync update to: '" + newStatus + "' (" + updatedCount + " rows updated).", false);
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", updatedRows: updatedCount }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }
    
    // 4. REGISTRATION REMOVAL OPERATION
    if (action === 'deleteRegistration') {
      const teamName = postData.teamName;
      const email = postData.email;
      
      const lock = LockService.getScriptLock();
      try {
        lock.waitLock(10000);
      } catch (lockErr) {}
      
      try {
        let sheet = ss.getSheetByName(REGISTER_SHEET_NAME);
        if (!sheet && ss.getSheets().length > 0) {
          sheet = ss.getSheets()[0];
        }
        
        if (!sheet) {
          return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet Registrations not found" }))
            .setMimeType(ContentService.MimeType.JSON);
        }
        
        const values = sheet.getDataRange().getValues();
        const targetEmail = (email || "").toString().trim().toLowerCase();
        const targetTeam = (teamName || "").toString().trim().toLowerCase();
        let deletedCount = 0;
        
        // Traverse backwards to avoid row index shifts during deletion
        for (let i = values.length - 1; i >= 1; i--) {
          const sheetEmail = (values[i][3] || "").toString().trim().toLowerCase();
          const sheetTeam = (values[i][0] || "").toString().trim().toLowerCase();
          
          let isMatch = false;
          if (targetTeam && sheetTeam === targetTeam) {
            if (!targetEmail || sheetEmail === targetEmail) {
              isMatch = true;
            }
          }
          
          if (isMatch) {
            sheet.deleteRow(i + 1);
            deletedCount++;
          }
        }
        
        if (deletedCount > 0) {
          SpreadsheetApp.flush();
          logActivity(ss, "Delete Registration", email, teamName, "Deleted " + deletedCount + " registration rows.", false);
        }
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", deletedCount: deletedCount }))
          .setMimeType(ContentService.MimeType.JSON);
      } finally {
        lock.releaseLock();
      }
    }
    
    // 5. TEST DIAGNOSTICS OPERATION
    if (action === 'test') {
      let quota = -1;
      try {
        quota = MailApp.getRemainingDailyQuota();
      } catch (qErr) {}
      logActivity(ss, "Diagnostics", Session.getActiveUser().getEmail(), "Web Test", "API ping successful.", false);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Google Apps Script connected. API works.", 
        quota: quota 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action parameter." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    console.error("❌ Fatal Error in doPost: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// CORE HELPERS
// ==========================================

/**
 * Safely fetches an existing sheet, or constructs and designs it if missing.
 */
function getOrCreateSheet(ss, sheetName, headers) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  if (!sheetName) {
    sheetName = REGISTER_SHEET_NAME;
  }
  if (!headers) {
    headers = REGISTRATION_HEADERS;
  }
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    
    // Auto-formatting headers professionally
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4f46e5"); // Indigo Primary
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    headerRange.setFontFamily("Arial");
    
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 28);
    
    // Add validation drop-down to column H (Status) for registrations
    if (sheetName === REGISTER_SHEET_NAME) {
      const statusRange = sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1);
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Registered", "Emailed", "Verified"], true)
        .setAllowInvalid(true)
        .build();
      statusRange.setDataValidation(rule);
    }
    
    // Initial column scaling
    for (let col = 1; col <= headers.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }
  return sheet;
}

/**
 * Updates row statuses matching the normalized teamName or email.
 */
function updateRowStatus(ss, teamName, email, status) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  let sheet = ss.getSheetByName(REGISTER_SHEET_NAME);
  if (!sheet && ss.getSheets().length > 0) {
    sheet = ss.getSheets()[0];
  }
  if (!sheet) return 0;
  
  const values = sheet.getDataRange().getValues();
  const targetEmail = (email || "").toString().trim().toLowerCase();
  const targetTeam = (teamName || "").toString().trim().toLowerCase();
  
  const normalizeStr = function(str) {
    return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
  };
  
  const normTargetTeam = normalizeStr(targetTeam);
  let updatedCount = 0;
  
  // Create an array to hold all status values for column H (column 8)
  const statusValues = [];
  
  for (let i = 1; i < values.length; i++) {
    const sheetEmail = (values[i][3] || "").toString().trim().toLowerCase();
    const sheetTeam = (values[i][0] || "").toString().trim().toLowerCase();
    const normSheetTeam = normalizeStr(sheetTeam);
    
    let isMatch = false;
    if (targetTeam && sheetTeam === targetTeam && targetEmail && sheetEmail === targetEmail) {
      isMatch = true;
    } else if (normTargetTeam && normSheetTeam === normTargetTeam && targetEmail && sheetEmail === targetEmail) {
      isMatch = true;
    } else if (targetTeam && sheetTeam === targetTeam) {
      isMatch = true;
    } else if (normTargetTeam && normSheetTeam === normTargetTeam) {
      isMatch = true;
    }
    
    if (isMatch) {
      statusValues.push([status]);
      updatedCount++;
    } else {
      // Keep existing status value from the sheet row
      statusValues.push([values[i][7] || "Registered"]);
    }
  }
  
  if (updatedCount > 0) {
    // Write all status values to column H in a single batch operation
    sheet.getRange(2, 8, statusValues.length, 1).setValues(statusValues);
    SpreadsheetApp.flush();
  }
  return updatedCount;
}

/**
 * Logs dashboard and email operations with auto-pruning.
 */
function logActivity(ss, action, email, teamName, details, isError) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  try {
    const sheet = getOrCreateSheet(ss, LOG_SHEET_NAME, LOG_HEADERS);
    sheet.appendRow([
      new Date().toISOString(),
      action,
      email || "N/A",
      teamName || "N/A",
      details || "",
      isError ? "Error" : "Success"
    ]);
    
    const lastRowIndex = sheet.getLastRow();
    const rowRange = sheet.getRange(lastRowIndex, 1, 1, LOG_HEADERS.length);
    rowRange.setFontFamily("Arial");
    
    if (isError) {
      rowRange.setBackground("#fee2e2"); // Light red error accent
      sheet.getRange(lastRowIndex, 6).setFontColor("#dc2626").setFontWeight("bold");
    } else {
      sheet.getRange(lastRowIndex, 6).setFontColor("#16a34a").setFontWeight("bold");
    }
    
    // Self-Pruning: Limit logs to the last 2000 entries
    if (lastRowIndex > 2000) {
      sheet.deleteRows(2, 500); // deletes rows 2 through 501
    }
  } catch (err) {
    console.error("⚠️ Failed to write log: " + err.toString());
  }
}
