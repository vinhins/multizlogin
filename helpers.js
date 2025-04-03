// helpers.js
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getWebhookUrl(key) {
    try {
        if (key === 'messageWebhookUrl') {
            return process.env.MESSAGE_WEBHOOK_URL || "";
        } else if (key === 'groupEventWebhookUrl') {
            return process.env.GROUP_EVENT_WEBHOOK_URL || "";
        } else if (key === 'reactionWebhookUrl') {
            return process.env.REACTION_WEBHOOK_URL || "";
        } else {
            return "";
        }
    } catch (error) {
        console.error("Error getting webhook config:", error);
        return "";
    }
}

export async function triggerN8nWebhook(msg, webhookUrl) {
    if (!webhookUrl) {
        console.warn("Webhook URL is empty, skipping webhook trigger");
        return false;
    }
    
    try {
        await axios.post(webhookUrl, msg, { headers: { 'Content-Type': 'application/json' } });
        return true;
    } catch (error) {
        console.error("Error sending webhook request:", error.message);
        return false;
    }
}

export async function saveImage(url) {
    try {
        const imgPath = "./temp.png";

        const { data } = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(imgPath, Buffer.from(data, "utf-8"));

        return imgPath;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export function removeImage(imgPath) {
    try {
        fs.unlinkSync(imgPath);
    } catch (error) {
        console.error(error);
    }
}