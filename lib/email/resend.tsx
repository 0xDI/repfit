import { Resend } from "resend"

// Initialize Resend lazily to prevent crashes when API key is missing
let resendInstance: Resend | null = null

const getResend = (): Resend | null => {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

const getFromEmail = () => {
  const domain = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  return `REPFIT <${domain}>`
}

export async function sendSubscriptionLowBalanceEmail(
  email: string,
  name: string,
  planName: string,
  remaining: number,
  type: "trainings" | "days",
) {
  const subject =
    type === "trainings"
      ? `Only ${remaining} Training${remaining === 1 ? "" : "s"} Left!`
      : `Your Subscription Expires in ${remaining} Day${remaining === 1 ? "" : "s"}!`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .plan-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .cta-button { display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Subscription Alert</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <div class="warning-box">
              <strong style="font-size: 16px;">
                ${type === "trainings"
      ? `You have only ${remaining} training${remaining === 1 ? "" : "s"} remaining in your ${planName} plan!`
      : `Your ${planName} subscription expires in ${remaining} day${remaining === 1 ? "" : "s"}!`
    }
              </strong>
            </div>

            <p>Don't let your training momentum stop! Renew your subscription now to continue achieving your fitness goals.</p>

            <div class="plan-details">
              <div class="detail-row">
                <span style="color: #6b7280;">Current Plan:</span>
                <strong>${planName}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">${type === "trainings" ? "Trainings" : "Days"} Remaining:</span>
                <strong style="color: #dc2626;">${remaining}</strong>
              </div>
            </div>

            <p>Contact us to renew your subscription and keep your fitness journey on track!</p>

            <center>
              <a href="tel:+306937043559" class="cta-button">Call +30 693 704 3559</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Reply to this email or call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT. All rights reserved.</p>
            <p>This is an automated notification from your gym subscription system.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(), // Now uses environment variable
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send low balance email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendSubscriptionExpiredEmail(email: string, name: string, planName: string, price: number) {
  const subject = "Your Subscription Has Expired"

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .expired-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .plan-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .cta-button { display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔴 Subscription Expired</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <div class="expired-box">
              <strong style="font-size: 16px;">
                Your ${planName} subscription has expired.
              </strong>
            </div>

            <p>Your training plan has come to an end, but your fitness journey doesn't have to stop here!</p>

            <p>Renew your subscription today to:</p>
            <ul style="padding-left: 20px;">
              <li>Continue your training momentum</li>
              <li>Maintain your fitness progress</li>
              <li>Keep access to all gym facilities</li>
              <li>Book your preferred workout times</li>
            </ul>

            <div class="plan-details">
              <div class="detail-row">
                <span style="color: #6b7280;">Previous Plan:</span>
                <strong>${planName}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Renewal Price:</span>
                <strong style="color: #059669; font-size: 20px;">€${price}</strong>
              </div>
            </div>

            <p><strong>Ready to continue your fitness journey?</strong></p>
            <p>Contact us now to renew your subscription and get back to training!</p>

            <center>
              <a href="tel:+306937043559" class="cta-button">Call +30 693 704 3559 to Renew</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              We're here to help! Call us at +30 693 704 3559 or reply to this email.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT. All rights reserved.</p>
            <p>This is an automated notification from your gym subscription system.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(), // Now uses environment variable
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send expired email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendSubscriptionRenewalConfirmation(
  email: string,
  name: string,
  planName: string,
  trainings: number,
  endDate: string,
  price: number,
) {
  const subject = "Subscription Renewed Successfully!"

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .success-box { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .plan-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .cta-button { display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Welcome Back!</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <div class="success-box">
              <strong style="font-size: 16px;">
                Your ${planName} subscription has been renewed successfully!
              </strong>
            </div>

            <p>Thank you for continuing your fitness journey with us! Your subscription is now active and ready to use.</p>

            <div class="plan-details">
              <h3 style="margin-top: 0; color: #059669;">Subscription Details</h3>
              <div class="detail-row">
                <span style="color: #6b7280;">Plan:</span>
                <strong>${planName}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Trainings Included:</span>
                <strong>${trainings} sessions</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Valid Until:</span>
                <strong>${new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Amount Paid:</span>
                <strong style="color: #059669; font-size: 20px;">€${price}</strong>
              </div>
            </div>

            <p><strong>You can now:</strong></p>
            <ul style="padding-left: 20px;">
              <li>Book your workout sessions through the app</li>
              <li>Access all gym facilities</li>
              <li>Track your fitness progress</li>
              <li>Enjoy your ${trainings} training sessions</li>
            </ul>

            <p>Ready to get started? Log in to your dashboard and book your next session!</p>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions about your subscription? Call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT. Keep up the great work! We're excited to support your fitness goals.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(), // Now uses environment variable
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send renewal confirmation:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendBookingConfirmationEmail(
  email: string,
  name: string,
  sessionDate: string,
  startTime: string,
  endTime: string,
) {
  const subject = "Booking Confirmed - Your Workout is Scheduled!"

  const formattedDate = new Date(sessionDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .session-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <p>Your workout session has been successfully booked!</p>

            <div class="session-box">
              <h3 style="margin-top: 0; color: #059669;">Session Details</h3>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
            </div>

            <p><strong>Important:</strong> If you need to cancel, please do so at least 5 hours before your session to receive a token refund.</p>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT. See you at the gym!</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send booking confirmation email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendBookingCancellationEmail(
  email: string,
  name: string,
  sessionDate: string,
  startTime: string,
  tokenRefunded: boolean,
) {
  const subject = "Booking Cancelled"

  const formattedDate = new Date(sessionDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .info-box { background: ${tokenRefunded ? "#fef3c7" : "#fee2e2"}; border-left: 4px solid ${tokenRefunded ? "#f59e0b" : "#dc2626"}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">Booking Cancelled</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <p>Your workout session has been cancelled.</p>

            <div class="info-box">
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${startTime}</p>
              <p style="margin: 8px 0;"><strong>Token ${tokenRefunded ? "Refunded" : "Not Refunded"}:</strong> ${tokenRefunded ? "Your workout token has been refunded." : "Cancelled within 5 hours - no token refund."}</p>
            </div>

            <p>You can book a new session anytime through the dashboard.</p>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send cancellation email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendBookingRescheduledEmail(
  email: string,
  name: string,
  oldDate: string,
  oldTime: string,
  newDate: string,
  newTime: string,
  newEndTime: string,
) {
  const subject = "Booking Rescheduled Successfully"

  const formattedOldDate = new Date(oldDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const formattedNewDate = new Date(newDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .session-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔄 Booking Rescheduled</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <p>Your workout session has been successfully rescheduled!</p>

            <div style="background: #fee2e2; padding: 15px; margin: 20px 0; border-radius: 4px; text-decoration: line-through; opacity: 0.7;">
              <p style="margin: 8px 0;"><strong>Previous:</strong> ${formattedOldDate} at ${oldTime}</p>
            </div>

            <div class="session-box">
              <h3 style="margin-top: 0; color: #2563eb;">New Session Details</h3>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedNewDate}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${newTime} - ${newEndTime}</p>
            </div>

            <p>See you at the gym!</p>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send reschedule email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

export async function sendSubscriptionUpdatedEmail(
  email: string,
  name: string,
  planName: string,
  trainingsRemaining: number,
  endDate: string,
) {
  const subject = "Subscription Updated"

  const formattedDate = new Date(endDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .plan-details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #d1fae5; }
          .detail-row:last-child { border-bottom: none; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📋 Subscription Updated</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 10px;">Hello ${name},</p>
            
            <p>Your subscription has been updated by the gym administrator.</p>

            <div class="plan-details">
              <h3 style="margin-top: 0; color: #059669;">Current Subscription</h3>
              <div class="detail-row">
                <span style="color: #6b7280;">Plan:</span>
                <strong>${planName}</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Trainings Remaining:</span>
                <strong>${trainingsRemaining} sessions</strong>
              </div>
              <div class="detail-row">
                <span style="color: #6b7280;">Valid Until:</span>
                <strong>${formattedDate}</strong>
              </div>
            </div>

            <p>Log in to your dashboard to view the details and book your sessions!</p>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Questions? Call us at +30 693 704 3559.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} REPFIT.</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const resend = getResend()
    if (!resend) {
      console.warn("Resend API key not configured, skipping email")
      return null
    }
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error("Failed to send subscription updated email:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}
