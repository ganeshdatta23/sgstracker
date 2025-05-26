// src/app/api/telegram-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SwamijiLocation } from '@/lib/types';

const LOG_PREFIX = "[Telegram Bot]";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration is missing. Please check environment variables.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Define the expected structure of a Telegram Update and Message
interface TelegramLocation {
  latitude: number;
  longitude: number;
  horizontal_accuracy?: number;
}

interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: { id: number; is_bot: boolean; first_name?: string; username?: string };
  chat: TelegramChat;
  date: number;
  location?: TelegramLocation;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

// Helper function to send a message via Telegram Bot API
async function sendMessageToTelegram(chatId: number | string, text: string, botToken: string | undefined) {
  if (!botToken) {
    console.error(`${LOG_PREFIX} Telegram Bot Token is not configured. Cannot send message.`);
    return;
  }
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const responseData = await response.json();
    if (!responseData.ok) {
      console.error(`${LOG_PREFIX} Error sending Telegram message to chat ID ${chatId}:`, responseData);
    } else {
      console.log(`${LOG_PREFIX} Message sent to Telegram chat ID ${chatId}: "${text}"`);
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to send message to Telegram chat ID ${chatId}:`, error);
  }
}

export async function POST(request: NextRequest) {
  console.log(`${LOG_PREFIX} Webhook POST request received. Verifying environment...`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const authorizedChatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID;
  if (!botToken || !authorizedChatId) {
    console.error(`${LOG_PREFIX} CRITICAL: Telegram configuration is missing.`);
    return NextResponse.json({ error: 'Telegram configuration incomplete.' }, { status: 500 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (error) {
    console.error(`${LOG_PREFIX} CRITICAL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Database configuration incomplete.' }, { status: 500 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch (e) {
    console.error(`${LOG_PREFIX} Error parsing request JSON from Telegram:`, e);
    return NextResponse.json({ error: 'Invalid request format.' }, { status: 400 });
  }

  const message = update.message;
  if (!message) {
    return NextResponse.json({ status: 'ok', message: 'Update received, no message content.' });
  }

  const chatId = message.chat.id.toString();
  
  if (chatId !== authorizedChatId) {
    console.warn(`${LOG_PREFIX} Unauthorized attempt from chat ID: ${chatId}`);
    const unauthorizedMsg = "You are not authorized to update Swamiji's location using this bot.";
    await sendMessageToTelegram(chatId, unauthorizedMsg, botToken);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (message.location) {
    const { latitude, longitude } = message.location;
    try {
      const { error } = await supabase
        .from('locations')
        .upsert({
          id: 'swamiji_location',
          latitude,
          longitude,
          address: null,
          googleMapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const successMsg = `✅ Location updated successfully!\n🌍 [View on Map](https://www.google.com/maps?q=${latitude},${longitude})`;
      await sendMessageToTelegram(authorizedChatId, successMsg, botToken);
      
      return NextResponse.json({ status: 'ok', message: 'Location updated successfully' });
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating location:`, error);
      const errorMsg = `❌ Failed to update location.\nError: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await sendMessageToTelegram(authorizedChatId, errorMsg, botToken);
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
  } else if (message.text) {
    const text = message.text.trim();
    
    if (text === '/debug') {
      try {
        let debugMsg = '*🔍 Server Environment Debug Info*\n\n';
        debugMsg += '*Database Connection:*\n';
        
        const { error } = await supabase
          .from('locations')
          .select('id')
          .limit(1);
        
        if (error) {
          debugMsg += `   ❌ Database connection failed: ${error.message}\n`;
        } else {
          debugMsg += '   ✅ Database connection successful\n';
        }
        
        await sendMessageToTelegram(authorizedChatId, debugMsg, botToken);
        return NextResponse.json({ status: 'Debug info sent' });
      } catch (error) {
        const errorMsg = `❌ Error running debug command: ${error instanceof Error ? error.message : 'Unknown error'}`;
        await sendMessageToTelegram(authorizedChatId, errorMsg, botToken);
        return NextResponse.json({ error: 'Debug command failed' }, { status: 500 });
      }
    } else {
      const helpMsg = "Send a location pin to update Swamiji's location, or use /debug to check system status.";
      await sendMessageToTelegram(authorizedChatId, helpMsg, botToken);
      return NextResponse.json({ status: 'Help message sent' });
    }
  }

  return NextResponse.json({ status: 'ok' });
}

export async function GET() {
  return NextResponse.json({ 
    message: "Telegram webhook endpoint is active. Use POST for updates from Telegram." 
  });
}
