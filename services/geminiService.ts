import { GoogleGenAI, Modality } from "@google/genai";
import { Coordinates, WalletItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text/Chat with Maps Grounding ---

export const sendChatMessage = async (
  message: string, 
  userLocation?: Coordinates,
  walletItems?: WalletItem[]
) => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    // Configure tools for Maps Grounding
    const tools: any[] = [{ googleMaps: {} }];
    
    // Configure toolConfig with user location if available
    // The SDK expects this specific structure for Maps Grounding
    let toolConfig: any = undefined;
    
    if (userLocation) {
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        }
      };
    }

    // Prepare context about wallet contents
    let contentsContext = "";
    if (walletItems && walletItems.length > 0) {
      const itemsList = walletItems.map(item => {
        let details = `- ${item.name} (${item.type})`;
        if (item.number) details += `, Numero: ${item.number}`;
        if (item.expiryDate) details += `, Scadenza: ${item.expiryDate}`;
        if (item.supportPhone) details += `, Tel. Blocco/Smarrimento: ${item.supportPhone}`;
        return details;
      }).join("\n");
      contentsContext = `\n\nIl contenuto attuale del portafoglio (registrato dall'utente) è:\n${itemsList}`;
    } else {
      contentsContext = "\n\nL'utente non ha ancora registrato il contenuto del portafoglio.";
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        tools: tools,
        toolConfig: toolConfig, // Pass the properly structured object or undefined
        systemInstruction: `Sei l'assistente IA ufficiale di 'SafeWallet Sagl', un'azienda svizzera fondata da studenti della Scuola Cantonale di Commercio. 
        
        Il tuo tono è professionale, elegante, sicuro e rassicurante. 
        
        Caratteristiche del prodotto da enfatizzare:
        1. Tecnologia GPS integrata direttamente nel tessuto (non una carta estraibile come i competitor Ekster).
        2. Massima sicurezza: non può essere rimosso.
        3. Design elegante e moderno.
        4. Servizio di manutenzione e sostituzione GPS esclusivo.
        
        Funzioni: Aiuti a localizzare il portafoglio, dai consigli di sicurezza e usi Google Maps per indicare luoghi sicuri o stazioni di polizia se necessario. 
        
        IMPORTANTE: Hai accesso ai dati sugli oggetti contenuti nel portafoglio dell'utente. Se l'utente chiede cosa c'è dentro o cosa fare in caso di smarrimento (es. "Ho perso il portafoglio"), usa le informazioni registrate (in particolare i numeri di telefono per il blocco carte) per dare istruzioni precise. ${contentsContext}
        
        Rispondi sempre in italiano.`
      }
    });

    return {
      text: response.text || "Non sono riuscito a elaborare la richiesta.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };

  } catch (error: any) {
    // Ensure we log a string message, not an object, to avoid [object Object] in consoles
    console.error("Gemini Chat Error:", error?.message || error);
    return { text: "Spiacente, ho problemi di connessione alla rete SafeWallet in questo momento." };
  }
};

// --- Text-to-Speech (TTS) ---

export const generateWalletVoiceAlert = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Assertive but calm
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContext,
        24000,
        1
      );
      return audioBuffer;
    }
    return null;

  } catch (error: any) {
    console.error("Gemini TTS Error:", error?.message || error);
    return null;
  }
};

// --- Audio Helpers ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playAudioBuffer = (buffer: AudioBuffer) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start();
};