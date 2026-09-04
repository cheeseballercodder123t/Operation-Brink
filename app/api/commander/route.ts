import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface BattlefieldSummary {
  simTick: number;
  simTime: string;
  defcon: number;
  factions: {
    id: string;
    name: string;
    unitsCount: number;
    totalStrength: number;
    fuelReserves: number;
    controlledNodes: string[];
  }[];
  activeAirSorties: {
    factionId: string;
    role: string;
    targetDesc: string;
  }[];
  recentIncidents: string[];
  unifiedState: boolean;
}

export async function POST(req: NextRequest) {
  let body: { battlefield?: BattlefieldSummary; preferredProvider?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const battlefield = body.battlefield;
  const prompt = `
You are the 1960s Cold War Autonomous Geopolitical & Military Strategic Orchestrator for "PROJECT BRINK".
Current simulation state:
- Time: ${battlefield?.simTime || "0600 HRS, OCT 1963"} (Tick ${battlefield?.simTick || 0})
- DEFCON Level: ${battlefield?.defcon || 3}
- Unified San Pietro State: ${battlefield?.unifiedState ? "YES (Awakened Superpower)" : "NO (Civil War active)"}
- Factions Status: ${JSON.stringify(battlefield?.factions || [])}
- Active Air Sorties: ${JSON.stringify(battlefield?.activeAirSorties || [])}
- Recent Combat Incidents: ${JSON.stringify(battlefield?.recentIncidents || [])}

Generate strategic operational orders for the 4 factions:
1. San Pietro Loyalists (Nationalist Junta)
2. San Pietro Liberation Front (People's Front)
3. Atlantic Coalition (Western Superpower)
4. Volskan Union (Eastern Hegemon)

Respond strictly in valid JSON without markdown wrapping or code blocks with the following schema:
{
  "provider": "PROVIDER_NAME",
  "doctrineTitle": "OPERATION NAME (e.g. OPERATION STEEL THUNDER)",
  "geopoliticalAssessment": "Brief 1-2 sentence 1960s situation appraisal",
  "transmissions": [
    {
      "factionId": "loyalists",
      "callsign": "SAN PIETRO HIGH COMMAND",
      "message": "Radio intercept text in authentic 1960s military cable tone",
      "priority": "HIGH" | "ROUTINE" | "FLASH"
    },
    {
      "factionId": "rebels",
      "callsign": "LIBERATION COMANDANCIA",
      "message": "Radio intercept text",
      "priority": "HIGH" | "ROUTINE" | "FLASH"
    },
    {
      "factionId": "coalition",
      "callsign": "ATLANTIC CARRIER STRIKE SEVENTH",
      "message": "Radio intercept text",
      "priority": "HIGH" | "ROUTINE" | "FLASH"
    },
    {
      "factionId": "volskan",
      "callsign": "VOLSKAN ADVISORY STAVKA",
      "message": "Radio intercept text",
      "priority": "HIGH" | "ROUTINE" | "FLASH"
    }
  ],
  "airDirectives": [
    {
      "factionId": "coalition" | "volskan" | "loyalists" | "rebels",
      "role": "AIR_SUPERIORITY" | "CAS" | "INTERCEPTION" | "INTERDICTION" | "RECON",
      "targetSector": "NORTH_RIVER" | "DELTA_BRIDGE" | "SIERRA_RANGE" | "OIL_REFINERIES" | "SANTA_MARIA"
    }
  ],
  "groundDirectives": [
    {
      "factionId": "loyalists" | "rebels" | "coalition" | "volskan",
      "stance": "OFFENSIVE_THRUST" | "DEFENSIVE_HOLD" | "FLANK_AMBUSH" | "WITHDRAW_REFUEL",
      "objective": "DELTA_BRIDGE" | "OIL_REFINERIES" | "SANTA_MARIA" | "MONTE_ORO" | "PORT_BELLA"
    }
  ]
}
`;

  // 1. Primary: Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        let cleanText = response.text.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        const parsed = JSON.parse(cleanText);
        parsed.provider = "GEMINI-3.8-FLASH";
        return NextResponse.json(parsed);
      }
    } catch (err) {
      console.warn("Gemini API call failed or rate limited, attempting Groq fallback:", err);
    }
  }

  // 2. Secondary Fallback: Groq API
  if (process.env.GROQ_API_KEY) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.6,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        const content = groqData.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          parsed.provider = "GROQ (LLAMA-3.3-70B)";
          return NextResponse.json(parsed);
        }
      }
    } catch (err) {
      console.warn("Groq API fallback failed, attempting OpenRouter fallback:", err);
    }
  }

  // 3. Tertiary Fallback: OpenRouter API
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.APP_URL || "https://project-brink.local",
          "X-Title": "Project Brink Simulator",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      if (orRes.ok) {
        const orData = await orRes.json();
        let content = orData.choices?.[0]?.message?.content;
        if (content) {
          if (content.startsWith("```json")) {
            content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          } else if (content.startsWith("```")) {
            content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");
          }
          const parsed = JSON.parse(content);
          parsed.provider = "OPENROUTER (LLAMA-3.3-70B)";
          return NextResponse.json(parsed);
        }
      }
    } catch (err) {
      console.warn("OpenRouter API fallback failed:", err);
    }
  }

  // 4. Algorithmic / Heuristic Offline Fallback
  const algorithmicResponse = generateAlgorithmicDirectives(battlefield);
  return NextResponse.json(algorithmicResponse);
}

function generateAlgorithmicDirectives(battlefield?: BattlefieldSummary) {
  const isUnified = battlefield?.unifiedState ?? false;
  const tick = battlefield?.simTick ?? 1;

  const titles = [
    "OPERATION IRON SHIELD",
    "OPERATION AUTUMN VIPER",
    "OPERATION CRIMSON DAWN",
    "OPERATION GULF THUNDER",
    "OPERATION BEAR CLAW",
  ];
  const doctrineTitle = titles[tick % titles.length];

  return {
    provider: "ALGORITHMIC COMMAND ENGINE (HEURISTIC V4)",
    doctrineTitle,
    geopoliticalAssessment: isUnified
      ? "San Pietro has declared national sovereignty. Foreign proxy networks are collapsing under combined local counter-offensive."
      : "Frontline stabilizes along the central river line. Volskan heavy artillery is zeroing in as Atlantic air wings maintain naval corridor.",
    transmissions: [
      {
        factionId: "loyalists",
        callsign: "SAN PIETRO HIGH COMMAND",
        message: isUnified
          ? "TO ALL UNITS: CEASEFIRE WITH LIBERATION FORCES EFFECTIVE IMMEDIATELY. MERGE CODE: SOVEREIGN PATRIOT."
          : "ORDER 44: HOLD SANTA MARIA CITADEL. ARMOR MUST DENY OIL REFINERY TO GUERRILLA ADVANCE.",
        priority: "HIGH",
      },
      {
        factionId: "rebels",
        callsign: "LIBERATION COMANDANCIA",
        message: isUnified
          ? "COMRADES, THE JUNTA HAS YIELDED. WE ARE SAN PIETRO UNITED. EXPEL FOREIGN INTERVENTIONISTS!"
          : "AMBUSH CONVOYS IN SIERRA PASS. DEPLOY SA-2 RADAR TO AMBUSH IMPERIAL CLOSE AIR SUPPORT.",
        priority: "FLASH",
      },
      {
        factionId: "coalition",
        callsign: "ATLANTIC CARRIER STRIKE SEVENTH",
        message:
          "ADMIRALTY DISPATCH: F-4 PHANTOMS COMMENCING COMBAT AIR PATROL OVER DELTA SECTOR. INTERDICT ROGUE ARMOR.",
        priority: "ROUTINE",
      },
      {
        factionId: "volskan",
        callsign: "VOLSKAN ADVISORY STAVKA",
        message:
          "STAVKA DIRECTIVE: COMMENCE 152MM TUBE ARTILLERY BATTERY SALVOS ON WEST BANK CROSSINGS. SHIP SUPPLIES TO REBEL CADRES.",
        priority: "HIGH",
      },
    ],
    airDirectives: [
      { factionId: "coalition", role: "AIR_SUPERIORITY", targetSector: "DELTA_BRIDGE" },
      { factionId: "loyalists", role: "CAS", targetSector: "OIL_REFINERIES" },
      { factionId: "volskan", role: "INTERCEPTION", targetSector: "NORTH_RIVER" },
      { factionId: "rebels", role: "RECON", targetSector: "SANTA_MARIA" },
    ],
    groundDirectives: [
      { factionId: "loyalists", stance: "DEFENSIVE_HOLD", objective: "SANTA_MARIA" },
      { factionId: "rebels", stance: "FLANK_AMBUSH", objective: "OIL_REFINERIES" },
      { factionId: "coalition", stance: "OFFENSIVE_THRUST", objective: "PORT_BELLA" },
      { factionId: "volskan", stance: "OFFENSIVE_THRUST", objective: "DELTA_BRIDGE" },
    ],
  };
}
