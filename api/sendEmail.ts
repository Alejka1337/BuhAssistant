import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const allowCors = (fn: (req: VercelRequest, res: VercelResponse) => Promise<void>) => async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message, recordedUri } = request.body;

  if (!name || !email) {
    return response.status(400).json({ error: 'Name and Email are required.' });
  }

  let emailContent = `Новая заявка на консультацию:\n\nИмя: ${name}\nEmail: ${email}\n`;
  if (message) {
    emailContent += `Сообщение: ${message}\n`;
  }
  if (recordedUri) {
    emailContent += `Голосовое сообщение: ${recordedUri}\n`;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Консультация <onboarding@${process.env.RESEND_DOMAIN}>`, // Замените на ваш подтвержденный домен в Resend
      to: 'dmitrjialekseev16@gmail.com', 
      subject: 'Новая заявка на консультацию с BuhAssistant',
      text: emailContent,
    });

    if (error) {
      console.error('Resend Error:', error);
      return response.status(500).json({ error: error.message });
    }

    return response.status(200).json({ message: 'Email sent successfully', data });
  } catch (error: any) {
    console.error('Server Error:', error);
    return response.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

export default allowCors(handler);
