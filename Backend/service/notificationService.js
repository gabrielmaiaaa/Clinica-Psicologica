const transporter = require('../config/email');

const enviarNotificacao = async (destinatario, assunto, conteudoHTML) => {
    try {
        const info = await transporter.sendMail({
            from: '"Clinica Psicologa" <gabrielmaia6743@gmail.com>',
            to: destinatario,
            subject: assunto,
            html: conteudoHTML,
        });
        console.log(`Notificação enviada: ${info.messageId}`);
    } catch (error) {
        console.error('Erro ao enviar notificação:', error.message);
        throw new Error('Erro ao enviar notificação.');
    }
};

module.exports = { enviarNotificacao };
