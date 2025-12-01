// ../utils/emailService.js
const nodemailer = require('nodemailer');

// La variable 'transporter' se declarará aquí y se inicializará asíncronamente
let transporter;
let testAccountUser;

/**
 * Inicializa el transportador de Nodemailer.
 * Si NODE_ENV es 'production', usa credenciales reales.
 * Si no (testeo/desarrollo), usa Ethereal Email.
 */
async function initializeTransporter() {
    if (process.env.NODE_ENV === 'production') {
        // Lógica para un entorno de producción (si alguna vez lo necesitas)
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE_PROVIDER,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        testAccountUser = process.env.EMAIL_USER; // Usar el correo real
        console.log("⚙️  Servicio de correo inicializado en MODO PRODUCCIÓN.");
    } else {
        // Lógica para entorno de Desarrollo/Testeo (Ethereal Email)
        try {
            const account = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
            testAccountUser = account.user; // Usar el correo de Ethereal
            console.log("🛠️  Servicio de correo inicializado en MODO TESTEO (Ethereal Email).");
            console.log("   Cuenta Ethereal: ", account.user);
        } catch (error) {
            console.error('❌ Error al crear cuenta de prueba (Ethereal):', error.message);
            throw new Error("No se pudo inicializar el servicio de correo de prueba.");
        }
    }
}

// Llama a la inicialización inmediatamente
initializeTransporter();

/**
 * Función para enviar un correo electrónico.
 * Espera a que el transportador esté inicializado.
 */
async function sendEmail(to, subject, body, isHtml = false) {
    if (!transporter) {
        // En caso de que se llame antes de que initializeTransporter haya terminado
        await initializeTransporter();
    }

    try {
        console.log(`📧 Intentando enviar correo de TESTEO a: ${to} - Asunto: ${subject}`);
        
        const mailOptions = {
            from: testAccountUser, // Remitente de la cuenta de prueba
            to: to,                      
            subject: subject,            
        };

        if (isHtml) {
            mailOptions.html = body;
        } else {
            mailOptions.text = body;
        }

        const info = await transporter.sendMail(mailOptions);
        
        console.log("✅ Correo enviado con éxito (TESTEO):");
        console.log("   Message ID:", info.messageId);
        
        // Esta URL es donde puedes ver el contenido del correo
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`🔗  Vista previa del correo: ${previewUrl}`);
        }

        return info;
    } catch (error) {
        console.error("❌ Error al enviar el correo de TESTEO:", error.message);
        // No relanzamos el error en testeo, pero es bueno registrarlo.
        return null;
    }
}

module.exports = { sendEmail };