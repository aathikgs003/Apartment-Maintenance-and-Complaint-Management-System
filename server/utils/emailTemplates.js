
const styles = `
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #ddd;
`;

const headerStyle = `
  background-color: #2563eb;
  color: #ffffff;
  padding: 15px;
  text-align: center;
  border-radius: 8px 8px 0 0;
  margin-bottom: 20px;
`;

const contentStyle = `
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const footerStyle = `
  text-align: center;
  font-size: 12px;
  color: #777;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #2563eb;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 10px;
  font-weight: bold;
`;

export const complaintRaisedTemplate = (c) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">🚨 New Complaint Alert</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello Admin,</b></p>
      <p>A new complaint has been raised by a resident and requires your attention.</p>
      
      <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Complaint ID:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #dc2626; font-weight: bold;">${c.complaintId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Category:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.category}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Priority:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.priority || 'Medium'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Resident:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">
            ${c.residentId?.name || 'N/A'}<br/>
            <span style="font-size: 12px; color: #666;">${c.residentId?.email || ''} | Flat: ${c.residentId?.flatNumber || 'N/A'}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top;">Description:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; background-color: #f8fafc; border-radius: 4px;">
            ${c.description}
          </td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.FRONTEND_URL || '#'}/admin/complaints/${c._id}" style="${buttonStyle}">View & Assign Complaint</a>
      </div>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | Secure Notification</p>
    </div>
  </div>
`;

export const staffAssignedResidentTemplate = (staff, c) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">👷 Staff Assigned</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello ${c.residentId?.name || 'Resident'},</b></p>
      <p>Good news! Your complaint <b>#${c.complaintId}</b> has been assigned to a staff member.</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><b>Start Date:</b> ${new Date().toLocaleDateString()}</p>
        <p style="margin: 0;"><b>Assigned Staff:</b> <span style="font-weight: bold; font-size: 16px;">${staff.name}</span></p>
        <p style="margin: 5px 0 0 0;"><b>Contact No:</b> <span style="color: #2563eb; font-weight: bold;">${staff.phone || 'N/A'}</span></p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #555;">Expertise: ${(staff.expertise || []).join(', ')}</p>
      </div>

      <p>The staff member will attend to your issue shortly. You can track the status in real-time on your dashboard.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.FRONTEND_URL || '#'}/resident/complaints/${c._id}" style="${buttonStyle}">Track Status</a>
      </div>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | We are here to help!</p>
    </div>
  </div>
`;

export const workCompletedTemplate = (c) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">✅ Work Completed</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello ${c.residentId?.name || 'Resident'},</b></p>
      <p>We are pleased to inform you that work on your complaint <b>#${c.complaintId}</b> has been marked as <b>Completed</b>.</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><b>Completion Date:</b> ${new Date().toLocaleDateString()}</p>
        <p style="margin: 0;"><b>Resolution Time:</b> ${c.resolutionTime ? c.resolutionTime + ' hours' : 'N/A'}</p>
      </div>

      <p>Please login to your dashboard to inspect the work and provide a rating for the service.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.FRONTEND_URL || '#'}/resident/complaints/${c._id}" style="${buttonStyle}">Rate Service</a>
      </div>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | Thank you for your patience!</p>
    </div>
  </div>
`;

export const otpEmailTemplate = (otp, name) => `
<div style="${styles}">
  <div style="${headerStyle}">
    <h2 style="margin: 0; font-size: 24px;">🔐 Password Reset</h2>
  </div>
  <div style="${contentStyle}">
    <div style="text-align: center; margin-bottom: 20px;">
    </div>
    <p>Hello <b>${name}</b>,</p>
    <p>A request has been received to change the password for your account.</p>
    <p>Please use the following OTP (One-Time Password) to reset your password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; background: #EEF2FF; padding: 10px 20px; border-radius: 8px; border: 1px solid #C7D2FE;">
        ${otp}
      </span>
    </div>
    <p>This OTP is valid for <b>10 minutes</b>.</p>
    <p style="color: #ef4444; font-weight: bold;">Do not share this OTP with anyone for security reasons.</p>
    <p>If you did not initiate this request, please ignore this email or contact support immediately.</p>
  </div>
  <div style="${footerStyle}">
    <p>Apartment Maintenance System | Secure Automated Notification</p>
  </div>
</div>
`;

export const staffNotificationTemplate = (data) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">🔧 New Assignment</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello Staff Member,</b></p>
      <p>A new maintenance task has been assigned to you: <b>#${data.complaintNumber}</b></p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <h4 style="margin: 0 0 10px 0; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Resident Contact Details</h4>
        <p style="margin: 0 0 5px 0;"><b>Name:</b> ${data.residentName}</p>
        <p style="margin: 0 0 5px 0;"><b>Flat Number:</b> ${data.flatNumber || 'N/A'}</p>
        <p style="margin: 0;"><b>Mobile No:</b> <span style="color: #2563eb; font-weight: bold;">${data.residentPhone || 'N/A'}</span></p>
      </div>

      <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><b>Category:</b> ${data.category}</p>
        <p style="margin: 5px 0 0 0;"><b>Priority:</b> <span style="font-weight: bold; color: #c2410c;">${data.priority || 'Medium'}</span></p>
        <p style="margin: 5px 0 0 0;"><b>Deadline:</b> ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'N/A'}</p>
      </div>

      <p>Please review the complete details and visit the site at the scheduled time.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.FRONTEND_URL || '#'}/staff/complaints/${data.complaintId}" style="${buttonStyle}">View Task Details</a>
      </div>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | Work Management</p>
    </div>
  </div>
`;

export const statusUpdateTemplate = (data) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">🔄 Status Updated</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello Resident,</b></p>
      <p>The status of your complaint <b>#${data.complaintNumber}</b> has been updated.</p>
      
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <div style="margin-bottom: 10px;">
          <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">New Status</span>
          <div style="font-size: 18px; font-weight: bold; color: #2563eb;">${data.status}</div>
        </div>
        ${data.remarks ? `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
          <span style="font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Staff Remarks</span>
          <p style="margin: 5px 0 0 0; color: #334155; font-style: italic;">"${data.remarks}"</p>
        </div>
        ` : ''}
      </div>

      <p>You can view the full history and details on your dashboard.</p>

      <div style="text-align: center; margin-top: 25px;">
        <a href="${process.env.FRONTEND_URL || '#'}/resident/complaints/${data.complaintId || ''}" style="${buttonStyle}">View Complaint Details</a>
      </div>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | Stay Updated</p>
    </div>
  </div>
`;

export const complaintClosedTemplate = (data) => `
  <div style="${styles}">
    <div style="${headerStyle}">
      <h2 style="margin: 0; font-size: 24px;">📁 Complaint Closed</h2>
    </div>
    <div style="${contentStyle}">
      <p style="font-size: 16px;"><b>Hello Resident,</b></p>
      <p>Your complaint <b>#${data.complaintNumber}</b> has been successfully resolved and closed by the administration.</p>
      
      <div style="text-align: center; padding: 30px; background-color: #f8fafc; border-radius: 12px; margin: 20px 0; border: 1px dashed #cbd5e1;">
        <div style="font-size: 48px; margin-bottom: 10px;">🏁</div>
        <h3 style="margin: 0; color: #1e293b;">Task Finalized</h3>
        <p style="color: #64748b; margin-top: 5px;">Thank you for your patience during the resolution process.</p>
      </div>

      ${data.remarks ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px;"><b>Closing Remarks:</b> ${data.remarks}</p>
      </div>
      ` : ''}

      <p>If you have further issues, please feel free to raise a new complaint.</p>
    </div>
    <div style="${footerStyle}">
      <p>Apartment Maintenance System | Quality Service Guaranteed</p>
    </div>
  </div>
`;
