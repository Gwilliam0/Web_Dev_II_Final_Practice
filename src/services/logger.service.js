import fetch from 'node-fetch';

export const sendSlackNotification = async (errorData) => {
  const { status, message, method, route, stack } = errorData;
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) return;

  const payload = {
    text: `*5XX Server Error Detected in BildyApp*`,
    attachments: [
      {
        color: "#ff0000",
        fields: [
          { title: "Timestamp", value: new Date().toISOString(), short: true },
          { title: "Method", value: method, short: true },
          { title: "Route", value: route, short: false },
          { title: "Error Message", value: message, short: false },
        ],
        text: `*Stack Trace:*\n\`\`\`${stack}\`\`\``,
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
};