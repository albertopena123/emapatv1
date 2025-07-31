// src/lib/email.ts
import nodemailer from 'nodemailer'


// Crear transporter con la configuración de Gmail
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.MAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

interface SendPasswordResetEmailProps {
  to: string
  name: string
  resetUrl: string
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailProps) {
  const mailOptions = {
    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: "🔐 Restablecer contraseña - Sistema de Agua",
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Restablecer contraseña - Sistema de Agua</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style>
            /* Reset styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 50%, #81d4fa 100%);
              margin: 0;
              padding: 0;
              line-height: 1.6;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              min-height: 100vh;
            }
            
            table {
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            
            img {
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
              -ms-interpolation-mode: bicubic;
            }
            
            /* Water animation background */
            .water-bg {
              background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
              position: relative;
              overflow: hidden;
            }
            
            .water-bg::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><defs><linearGradient id="wave" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:%23ffffff;stop-opacity:0.1" /><stop offset="50%" style="stop-color:%23ffffff;stop-opacity:0.3" /><stop offset="100%" style="stop-color:%23ffffff;stop-opacity:0.1" /></linearGradient></defs><path d="M0,10 Q25,0 50,10 T100,10 V20 H0 Z" fill="url(%23wave)"/></svg>') repeat-x;
              animation: wave 3s ease-in-out infinite;
              opacity: 0.6;
            }
            
            @keyframes wave {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(-25px); }
            }
            
            /* Main container */
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              box-shadow: 0 20px 40px rgba(1, 87, 155, 0.15);
              border-radius: 16px;
              overflow: hidden;
              position: relative;
            }
            
            /* Header */
            .header {
              background: linear-gradient(135deg, #0277bd 0%, #0288d1 25%, #039be5 50%, #03a9f4 75%, #29b6f6 100%);
              padding: 50px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="water-drops" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1" fill="white" opacity="0.1"/><circle cx="15" cy="15" r="0.5" fill="white" opacity="0.15"/><circle cx="10" cy="18" r="0.8" fill="white" opacity="0.08"/></pattern></defs><rect width="100" height="100" fill="url(%23water-drops)"/></svg>');
              animation: float 6s ease-in-out infinite;
            }
            
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            
            .header::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 20px;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,20 Q25,0 50,10 T100,0 V20 Z" fill="white"/></svg>') repeat-x;
              background-size: 100px 20px;
            }
            
            .logo-container {
              position: relative;
              z-index: 2;
            }
            
            .logo {
              width: 90px;
              height: 90px;
              background: rgba(255, 255, 255, 0.25);
              border-radius: 50%;
              margin: 0 auto 25px;
              display: flex;
              align-items: center;
              justify-content: center;
              backdrop-filter: blur(15px);
              border: 2px solid rgba(255, 255, 255, 0.3);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .logo svg {
              width: 45px;
              height: 45px;
              fill: white;
              filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
            }
            
            .header h1 {
              color: #ffffff;
              font-size: 32px;
              font-weight: 800;
              margin: 0 0 10px 0;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
              position: relative;
              z-index: 2;
              letter-spacing: -0.5px;
            }
            
            .header .subtitle {
              color: rgba(255, 255, 255, 0.95);
              font-size: 18px;
              margin: 0;
              position: relative;
              z-index: 2;
              font-weight: 500;
            }
            
            /* Content */
            .content {
              padding: 60px 40px;
              text-align: center;
              background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
            }
            
            .greeting {
              font-size: 24px;
              font-weight: 700;
              color: #01579b;
              margin-bottom: 15px;
              position: relative;
            }
            
            .greeting::after {
              content: '';
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              width: 60px;
              height: 3px;
              background: linear-gradient(90deg, #03a9f4, #29b6f6);
              border-radius: 2px;
            }
            
            .message {
              color: #37474f;
              font-size: 17px;
              line-height: 1.8;
              margin-bottom: 40px;
              max-width: 480px;
              margin-left: auto;
              margin-right: auto;
            }
            
            /* Button */
            .button-container {
              margin: 45px 0;
              position: relative;
            }
            
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #0277bd 0%, #0288d1 25%, #039be5 75%, #03a9f4 100%);
              color: #ffffff !important;
              padding: 18px 45px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 700;
              font-size: 17px;
              box-shadow: 0 12px 35px rgba(3, 169, 244, 0.4);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              border: none;
              cursor: pointer;
              position: relative;
              overflow: hidden;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              transition: left 0.5s;
            }
            
            .button:hover::before {
              left: 100%;
            }
            
            .button:hover {
              transform: translateY(-3px);
              box-shadow: 0 16px 45px rgba(3, 169, 244, 0.5);
            }
            
            /* Security notice */
            .security-notice {
              background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%);
              border-left: 5px solid #2196f3;
              padding: 25px;
              border-radius: 12px;
              margin: 35px 0;
              text-align: left;
              position: relative;
              box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
            }
            
            .security-notice::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="3" cy="3" r="0.5" fill="%232196f3" opacity="0.1"/><circle cx="17" cy="7" r="0.3" fill="%232196f3" opacity="0.1"/><circle cx="8" cy="17" r="0.4" fill="%232196f3" opacity="0.1"/></svg>');
              border-radius: 12px;
            }
            
            .security-notice .icon {
              display: inline-block;
              width: 24px;
              height: 24px;
              margin-right: 12px;
              vertical-align: middle;
              color: #1976d2;
            }
            
            .security-notice p {
              color: #1565c0;
              font-size: 15px;
              margin: 0;
              font-weight: 600;
              display: inline-block;
              vertical-align: middle;
              position: relative;
              z-index: 1;
            }
            
            /* Water drop decoration */
            .water-drops {
              position: absolute;
              top: 20px;
              right: 20px;
              width: 30px;
              height: 30px;
              opacity: 0.1;
            }
            
            /* Alternative link */
            .alternative-link {
              background: linear-gradient(135deg, #f8fbff 0%, #e3f2fd 100%);
              border: 2px solid #bbdefb;
              border-radius: 12px;
              padding: 25px;
              margin: 35px 0;
              text-align: left;
              position: relative;
            }
            
            .alternative-link h3 {
              color: #0d47a1;
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
            }
            
            .alternative-link h3::before {
              content: '🔗';
              margin-right: 8px;
              font-size: 18px;
            }
            
            .alternative-link .url {
              color: #1976d2;
              font-size: 13px;
              word-break: break-all;
              background-color: #ffffff;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e1f5fe;
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              box-shadow: inset 0 2px 4px rgba(33, 150, 243, 0.1);
            }
            
            /* Footer */
            .footer {
              background: linear-gradient(135deg, #e1f5fe 0%, #f3e5f5 100%);
              padding: 40px;
              text-align: center;
              border-top: 3px solid #81d4fa;
              position: relative;
            }
            
            .footer::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #03a9f4, #29b6f6, #4fc3f7, #81d4fa);
            }
            
            .footer-content {
              max-width: 400px;
              margin: 0 auto;
            }
            
            .footer p {
              font-size: 14px;
              color: #546e7a;
              margin: 10px 0;
              line-height: 1.6;
            }
            
            .footer .company-name {
              font-weight: 700;
              color: #0277bd;
              font-size: 16px;
              margin-bottom: 15px;
            }
            
            .footer .water-icon {
              display: inline-block;
              margin: 0 5px;
              color: #03a9f4;
            }
            
            /* Responsive */
            @media only screen and (max-width: 600px) {
              .email-container {
                margin: 10px;
                border-radius: 12px;
              }
              
              .header {
                padding: 40px 20px;
              }
              
              .content {
                padding: 40px 20px;
              }
              
              .footer {
                padding: 30px 20px;
              }
              
              .header h1 {
                font-size: 26px;
              }
              
              .button {
                padding: 16px 35px;
                font-size: 16px;
              }
              
              .greeting {
                font-size: 20px;
              }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .email-container {
                background-color: #ffffff;
              }
            }
          </style>
        </head>
        <body>
          <div class="water-bg" style="padding: 30px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td align="center">
                  <div class="email-container">
                    <!-- Header -->
                    <div class="header">
                      <div class="logo-container">
                        <div class="logo">
                          <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                            <path d="M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z" fill="white"/>
                            <path d="M7,12C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" fill="rgba(255,255,255,0.3)"/>
                          </svg>
                        </div>
                        <h1>Sistema de Agua</h1>
                        <p class="subtitle">Restablecer Contraseña</p>
                      </div>
                    </div>
                    
                    <!-- Content -->
                    <div class="content">
                      <div class="greeting">¡Hola ${name}! 💧</div>
                      
                      <p class="message">
                        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en nuestro 
                        <strong>Sistema de Gestión de Agua</strong>. Si fuiste tú quien realizó esta solicitud, 
                        haz clic en el botón de abajo para crear una nueva contraseña segura y continuar 
                        gestionando los servicios de agua.
                      </p>
                      
                      <div class="button-container">
                        <a href="${resetUrl}" class="button">
                          🔐 Restablecer Contraseña
                        </a>
                      </div>
                      
                      <div class="security-notice">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10.5V11.5H13.5V10.5C13.5,8.7 12.8,8.2 12,8.2Z"/>
                        </svg>
                        <p><strong>🕐 Importante:</strong> Este enlace expirará en 1 hora por tu seguridad y la protección del sistema.</p>
                      </div>
                      
                      <p style="font-size: 15px; color: #546e7a; margin-top: 35px;">
                        Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. 
                        Tu cuenta del sistema de agua permanecerá protegida y sin cambios.
                      </p>
                      
                      <div class="alternative-link">
                        <h3>¿El botón no funciona?</h3>
                        <p style="font-size: 14px; color: #37474f; margin-bottom: 12px;">
                          Copia y pega este enlace en tu navegador:
                        </p>
                        <div class="url">${resetUrl}</div>
                      </div>
                    </div>
                    
                    <!-- Footer -->
                    <div class="footer">
                      <div class="footer-content">
                        <p class="company-name">
                          <span class="water-icon">💧</span>
                          ${process.env.MAIL_FROM_NAME}
                          <span class="water-icon">💧</span>
                        </p>
                        <p><strong>Sistema de Gestión de Agua</strong></p>
                        <p>© ${new Date().getFullYear()} Todos los derechos reservados.</p>
                        <p>Comprometidos con la gestión eficiente del recurso hídrico</p>
                        <p style="margin-top: 20px; font-size: 13px; color: #78909c;">
                          Este es un correo automático del sistema, por favor no respondas a este mensaje.
                          <br>Para soporte técnico, contacta a nuestro equipo especializado.
                        </p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `,
    text: `
      🌊 SISTEMA DE AGUA - Restablecer Contraseña
      
      Hola ${name},
      
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en nuestro Sistema de Gestión de Agua.
      
      Para crear una nueva contraseña, visita el siguiente enlace:
      ${resetUrl}
      
      ⚠️ IMPORTANTE: Este enlace expirará en 1 hora por tu seguridad.
      
      Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
      Tu cuenta del sistema de agua permanecerá protegida.
      
      ---
      💧 ${process.env.MAIL_FROM_NAME} - Sistema de Gestión de Agua
      © ${new Date().getFullYear()} Todos los derechos reservados.
      
      Comprometidos con la gestión eficiente del recurso hídrico.
      Este es un correo automático, por favor no respondas a este mensaje.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email de restablecimiento enviado:", info.messageId)
    return info
  } catch (error) {
    console.error("Error enviando email:", error)
    throw error
  }
}

// Función para verificar la configuración del email
export async function verifyEmailConfiguration() {
  try {
    await transporter.verify()
    console.log("Configuración de email verificada correctamente")
    return true
  } catch (error) {
    console.error("Error verificando configuración de email:", error)
    return false
  }
}

// Función para enviar notificación de consumo de agua
export async function sendWaterConsumptionAlert({
  to,
  name,
  consumption,
  period,
  threshold,
}: {
  to: string
  name: string
  consumption: number
  period: string
  threshold: number
}) {
  const isHighConsumption = consumption > threshold

  const mailOptions = {
    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: `💧 ${isHighConsumption ? "Alerta" : "Reporte"} de Consumo de Agua - ${period}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de Consumo de Agua</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
              margin: 0;
              padding: 20px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(1, 87, 155, 0.15);
            }
            .header {
              background: linear-gradient(135deg, ${isHighConsumption ? "#f44336 0%, #d32f2f 100%" : "#0277bd 0%, #03a9f4 100%"});
              padding: 40px 30px;
              text-align: center;
              color: white;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 20px;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,20 Q25,0 50,10 T100,0 V20 Z" fill="white"/></svg>') repeat-x;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .consumption-card {
              background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 20px 0;
              border-left: 5px solid ${isHighConsumption ? "#f44336" : "#2196f3"};
            }
            .consumption-number {
              font-size: 36px;
              font-weight: 800;
              color: ${isHighConsumption ? "#d32f2f" : "#0277bd"};
              margin: 10px 0;
            }
            h1 {
              font-size: 28px;
              margin: 0;
              font-weight: 700;
            }
            p {
              color: #37474f;
              font-size: 16px;
              line-height: 1.7;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isHighConsumption ? "⚠️ Alerta de Consumo Alto" : "📊 Reporte de Consumo"}</h1>
              <p>Sistema de Gestión de Agua</p>
            </div>
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              
              <div class="consumption-card">
                <p style="margin: 0; font-size: 18px; font-weight: 600;">Consumo en ${period}</p>
                <div class="consumption-number">${consumption} L</div>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  ${
                    isHighConsumption
                      ? `Límite establecido: ${threshold} L - Has excedido el límite`
                      : `Dentro del límite establecido: ${threshold} L`
                  }
                </p>
              </div>
              
              <p>
                ${
                  isHighConsumption
                    ? "Tu consumo ha superado el límite establecido. Te recomendamos revisar posibles fugas o ajustar el uso del agua."
                    : "Tu consumo está dentro de los parámetros normales. ¡Gracias por el uso responsable del agua!"
                }
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Alerta de consumo enviada:", info.messageId)
    return info
  } catch (error) {
    console.error("Error enviando alerta de consumo:", error)
    throw error
  }
}

// Función para enviar bienvenida al sistema de agua
export async function sendWelcomeWaterSystemEmail({
  to,
  name,
  accountNumber,
}: {
  to: string
  name: string
  accountNumber: string
}) {
  const mailOptions = {
    from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
    to,
    subject: "🌊 ¡Bienvenido al Sistema de Gestión de Agua!",
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenido al Sistema de Agua</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
              margin: 0;
              padding: 20px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(1, 87, 155, 0.15);
            }
            .header {
              background: linear-gradient(135deg, #0277bd 0%, #03a9f4 100%);
              padding: 50px 30px;
              text-align: center;
              color: white;
              position: relative;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 20px;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,20 Q25,0 50,10 T100,0 V20 Z" fill="white"/></svg>') repeat-x;
            }
            .content {
              padding: 50px 40px;
              text-align: center;
            }
            .account-info {
              background: linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              border-left: 5px solid #2196f3;
            }
            h1 {
              font-size: 32px;
              margin: 0;
              font-weight: 800;
            }
            p {
              color: #37474f;
              font-size: 16px;
              line-height: 1.7;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido ${name}! 🌊</h1>
              <p>Tu cuenta ha sido activada exitosamente</p>
            </div>
            <div class="content">
              <p>Nos complace darte la bienvenida al <strong>Sistema de Gestión de Agua</strong>.</p>
              
              <div class="account-info">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #0277bd;">
                  Tu número de cuenta
                </p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 800; color: #01579b;">
                  ${accountNumber}
                </p>
              </div>
              
              <p>
                Ahora puedes acceder a tu cuenta para consultar tu consumo, historial de pagos, 
                y gestionar todos los servicios relacionados con tu suministro de agua.
              </p>
              
              <p style="color: #0277bd; font-weight: 600;">
                💧 Juntos cuidamos el agua, nuestro recurso más valioso 💧
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email de bienvenida enviado:", info.messageId)
    return info
  } catch (error) {
    console.error("Error enviando email de bienvenida:", error)
    throw error
  }
}
