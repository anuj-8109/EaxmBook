import nodemailer from 'nodemailer';
import Setting from '../models/Setting.js';

let cachedTransporter = null;
let cachedConfigSignature = null;

const getConfigSignature = (config) => {
  if (!config) return '';
  return `${config.host}-${config.port}-${config.user}-${config.fromEmail}`;
};

const getActiveSettings = async () => {
  const settings = await Setting.findOne().sort({ updated_at: -1 }).lean();
  return settings || {};
};

const getTransporter = async () => {
  const settings = await getActiveSettings();
  const smtpConfig = settings.smtp;
  console.log({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure ?? false,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  });
  if (
    smtpConfig &&
    smtpConfig.host &&
    smtpConfig.port &&
    smtpConfig.user &&
    smtpConfig.password &&
    smtpConfig.fromEmail
  ) {
    const signature = getConfigSignature(smtpConfig);
    if (!cachedTransporter || cachedConfigSignature !== signature) {
      cachedTransporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure ?? false,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.password,
        },
      });
      cachedConfigSignature = signature;
    }
    return { transporter: cachedTransporter, smtpConfig };
  }

  throw new Error('SMTP configuration is not set. Please configure it in Admin Settings.');
};

const buildOtpTemplate = async ({ code, type }) => {
  const settings = await getActiveSettings();
  const appName = settings.system?.app_name || 'Easy Exam Gen';
  const logo = settings.system?.logo || null;
  
  const titleMap = {
    login: 'Login Verification Code',
    register: 'Complete Your Registration',
    reset: 'Password Reset Code',
  };

  const title = titleMap[type] || 'Verification Code';
  const logoHtml = logo 
    ? `<img src="${logo}" alt="${appName}" style="height: 48px; width: auto; margin-bottom: 12px;" />`
    : `<div style="font-size: 28px; font-weight: bold; margin-bottom: 8px;">${appName}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
          ${logoHtml}
          <p style="margin: 8px 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.95); font-weight: 500;">${title}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; background: #ffffff;">
          <p style="font-size: 16px; color: #1f2937; margin: 0 0 24px 0; line-height: 1.6;">
            Use the verification code below to continue:
          </p>
          
          <!-- OTP Code Box -->
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <span style="font-size: 36px; letter-spacing: 12px; font-weight: 700; color: #1e40af; font-family: 'Courier New', monospace; display: inline-block;">${code}</span>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.6;">
              ⏱️ <strong>This code will expire in 10 minutes.</strong><br>
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} ${appName} • Secure Learning Platform
          </p>
          <p style="margin: 8px 0 0; font-size: 11px; color: #9ca3af;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendOtpEmail = async ({ to, code, type }) => {
  const { transporter, smtpConfig } = await getTransporter();
  const settings = await getActiveSettings();
  const appName = settings.system?.app_name || 'Easy Exam Gen';

  await transporter.sendMail({
    from: smtpConfig.fromName
      ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail,
    to,
    subject: `Your ${appName} verification code`,
    html: await buildOtpTemplate({ code, type }),
  });
};

export const getPublicSettings = async () => {
  const settings = await getActiveSettings();
  return {
    google: {
      clientId: settings.google?.clientId || null,
    },
    smtpConfigured: Boolean(
      settings.smtp?.host &&
        settings.smtp?.port &&
        settings.smtp?.user &&
        settings.smtp?.password &&
        settings.smtp?.fromEmail,
    ),
  };
};

export const getSettings = async () => {
  return getActiveSettings();
};

// Build email template for new test notification
const buildNewTestTemplate = async ({ testName, categoryName, duration, marks, testUrl }) => {
  const settings = await getActiveSettings();
  const appName = settings.system?.app_name || 'Easy Exam Gen';
  const logo = settings.system?.logo || null;
  
  const logoHtml = logo 
    ? `<img src="${logo}" alt="${appName}" style="height: 56px; width: auto; margin-bottom: 12px;" />`
    : `<div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${appName}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); padding: 32px 24px; text-align: center;">
          ${logoHtml}
          <h1 style="margin: 12px 0 0; font-size: 28px; color: #ffffff; font-weight: 700;">🎉 New Test Available!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; background: #ffffff;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 16px 0; font-weight: 600;">Hello!</p>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
            Great news! A new test has been added to your subscribed category <strong style="color: #1f2937;">${categoryName}</strong>.
          </p>
          
          <!-- Test Details Card -->
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #1e40af; font-weight: 700;">${testName}</h2>
            <div style="display: flex; gap: 24px; margin-top: 16px;">
              <div style="flex: 1; background: #ffffff; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Duration</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e40af;">${duration}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">minutes</p>
              </div>
              <div style="flex: 1; background: #ffffff; padding: 16px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total Marks</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${marks}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">points</p>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${testUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); transition: transform 0.2s;">
              🚀 Start Test Now
            </a>
          </div>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
              📧 You're receiving this email because you're subscribed to the <strong>${categoryName}</strong> category.<br>
              Keep practicing and good luck with your exam preparation! 🎯
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} ${appName} • Secure Learning Platform
          </p>
          <p style="margin: 12px 0 0 0;">
            <a href="${testUrl.replace('/test/', '/subscriptions')}" style="color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 500;">Manage Subscriptions</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send new test notification email
export const sendNewTestEmail = async ({ to, testName, categoryName, duration, marks, testId, baseUrl = 'http://localhost:8080' }) => {
  try {
    const { transporter, smtpConfig } = await getTransporter();
    const settings = await getActiveSettings();
    const appName = settings.system?.app_name || 'Easy Exam Gen';
    const testUrl = `${baseUrl}/test/${testId}`;

    await transporter.sendMail({
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      to,
      subject: `🎉 New Test Available: ${testName}`,
      html: await buildNewTestTemplate({ testName, categoryName, duration, marks, testUrl }),
    });
  } catch (error) {
    console.error('Failed to send new test email:', error);
    throw error;
  }
};

// Build email template for feedback status update
const buildFeedbackStatusTemplate = async ({ userName, status, message, feedbackUrl, adminResponse }) => {
  const settings = await getActiveSettings();
  const appName = settings.system?.app_name || 'Easy Exam Gen';
  const logo = settings.system?.logo || null;
  
  const statusConfig = {
    resolved: {
      icon: '✅',
      title: 'Feedback Resolved',
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      message: 'Great news! Your feedback has been reviewed and resolved by our team.',
      actionText: 'View Feedback'
    },
    pending: {
      icon: '🔄',
      title: 'Feedback Reopened',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      message: 'Your feedback has been reopened and is back under review.',
      actionText: 'View Feedback'
    },
    reviewed: {
      icon: '👀',
      title: 'Feedback Under Review',
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      message: 'Your feedback has been reviewed by our team and is being processed.',
      actionText: 'View Feedback'
    }
  };

  const config = statusConfig[status] || statusConfig.reviewed;
  const truncatedMessage = message.length > 150 ? message.substring(0, 150) + '...' : message;
  const logoHtml = logo 
    ? `<img src="${logo}" alt="${appName}" style="height: 56px; width: auto; margin-bottom: 12px;" />`
    : `<div style="font-size: 32px; font-weight: bold; margin-bottom: 8px;">${appName}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: ${config.bgGradient}; padding: 32px 24px; text-align: center;">
          ${logoHtml}
          <h1 style="margin: 12px 0 0; font-size: 28px; color: #ffffff; font-weight: 700;">${config.icon} ${config.title}</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px; background: #ffffff;">
          <p style="font-size: 18px; color: #1f2937; margin: 0 0 16px 0; font-weight: 600;">Hello ${userName || 'User'}!</p>
          <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
            ${config.message}
          </p>
          
          <!-- Feedback Message Card -->
          <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 4px solid ${config.color}; padding: 20px; margin: 24px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            <p style="margin: 0 0 12px 0; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Your Feedback</p>
            <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.7; font-style: italic; background: #ffffff; padding: 16px; border-radius: 8px;">
              "${truncatedMessage}"
            </p>
          </div>

          ${adminResponse ? `
            <!-- Admin Response Card -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; padding: 20px; margin: 24px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);">
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Admin Response</p>
              <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.7; background: #ffffff; padding: 16px; border-radius: 8px;">
                ${adminResponse}
              </p>
            </div>
          ` : ''}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${feedbackUrl}" style="display: inline-block; background: ${config.bgGradient}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
              ${config.actionText}
            </a>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 1.6;">
              💚 Thank you for taking the time to share your feedback with us. Your input helps us improve ${appName} for everyone.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">
            © ${new Date().getFullYear()} ${appName} • Secure Learning Platform
          </p>
          <p style="margin: 12px 0 0 0;">
            <a href="${feedbackUrl.replace('/feedback', '/dashboard')}" style="color: #3b82f6; text-decoration: none; font-size: 13px; font-weight: 500;">Visit Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send feedback status update email
export const sendFeedbackStatusEmail = async ({ 
  to, 
  userName, 
  status, 
  message, 
  feedbackId, 
  adminResponse,
  baseUrl = 'http://localhost:8080' 
}) => {
  try {
    const { transporter, smtpConfig } = await getTransporter();
    const feedbackUrl = `${baseUrl}/feedback`;

    const statusSubjects = {
      resolved: '✅ Your Feedback Has Been Resolved',
      pending: '🔄 Your Feedback Has Been Reopened',
      reviewed: '👀 Your Feedback Is Under Review'
    };

    await transporter.sendMail({
      from: smtpConfig.fromName
        ? `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`
        : smtpConfig.fromEmail,
      to,
      subject: statusSubjects[status] || 'Feedback Status Update',
      html: await buildFeedbackStatusTemplate({ userName, status, message, feedbackUrl, adminResponse }),
    });
  } catch (error) {
    console.error('Failed to send feedback status email:', error);
    throw error;
  }
};


