import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface UnitSummary {
  id: string;
  name: string;
  factionId: string;
  type: string;
  x: number;
  y: number;
  strength: number;
  morale: number;
  fuel: number;
  inCombat: boolean;
  isEncircled?: boolean;
}

interface BattlefieldSummary {
  simTick: number;
  simTime: string;
  defcon: number;
  units?: UnitSummary[];
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
You have direct tactical and operational command over military units on a 1280x800 vector theater of operations.

Current simulation state:
- Time: ${battlefield?.simTime || "0600 HRS, OCT 1963"} (Tick ${battlefield?.simTick || 0})
- DEFCON Level: ${battlefield?.defcon || 3}
- Unified San Pietro State: ${battlefield?.unifiedState ? "YES (Awakened Superpower)" : "NO (Civil War active)"}
- Factions Status: ${JSON.stringify(battlefield?.factions || [])}
- Active Units on Map (Sample): ${JSON.stringify((battlefield?.units || []).slice(0, 16))}
- Active Air Sorties: ${JSON.stringify(battlefield?.activeAirSorties || [])}
- Recent Combat Incidents: ${JSON.stringify(battlefield?.recentIncidents || [])}

Generate real tactical unit orders, air sorties, doctrine title, and radio transmissions for all 4 factions:
1. San Pietro Loyalists (Nationalist Junta) - Defending Santa Maria and Delta bridge
2. San Pietro Liberation Front (Rebels) - Guerrilla forces ambushing refineries & passes
3. Atlantic Coalition (Western Superpower) - Carrier strike & Patton armor holding Port Bella
4. Volskan Union (Eastern Hegemon) - Heavy artillery & T-55 armor advancing west

Respond strictly in valid JSON without markdown wrapping or code blocks with the following schema:
{
  "provider": "PROVIDER_NAME",
  "doctrineTitle": "OPERATION NAME (e.g. OPERATION STEEL THUNDER)",
  "geopoliticalAssessment": "Brief 1-2 sentence 1960s situation appraisal",
  "corpsDirectives": [
    {
      "corpsName": "NORTHERN CORPS" | "SIERRA 1ST ARMY" | "7TH EXPEDITIONARY TF" | "8TH GUARDS SHOCK ARMY",
      "factionId": "loyalists" | "rebels" | "coalition" | "volskan",
      "unitsCount": 3,
      "directive": "3 Armored Divisions execute sweeping pincer along River Bank",
      "objective": "DELTA_BRIDGE" | "OIL_REFINERIES" | "SANTA_MARIA" | "MONTE_ORO" | "PORT_BELLA",
      "targetX": 580,
      "targetY": 490
    }
  ],
  "unitOrders": [
    {
      "unitId": "exact unit ID from battlefield or faction-role like loy-arm-1",
      "factionId": "loyalists" | "rebels" | "coalition" | "volskan",
      "action": "ATTACK" | "FLANK" | "DEFEND" | "RETREAT" | "MOVE" | "BOMBARD",
      "targetX": 640,
      "targetY": 420,
      "targetEnemyId": "optional enemy unit ID",
      "orderText": "Order dispatch (e.g. Flank enemy armor east of bridge)"
    }
  ],
  "transmissions": [
    {
      "factionId": "loyalists",
      "callsign": "SAN PIETRO HIGH COMMAND",
      "message": "Radio intercept text in authentic 1960s military cable tone",
      "priority": "HIGH"
    },
    {
      "factionId": "rebels",
      "callsign": "LIBERATION COMANDANCIA",
      "message": "Radio intercept text",
      "priority": "HIGH"
    },
    {
      "factionId": "coalition",
      "callsign": "ATLANTIC CARRIER STRIKE SEVENTH",
      "message": "Radio intercept text",
      "priority": "ROUTINE"
    },
    {
      "factionId": "volskan",
      "callsign": "VOLSKAN ADVISORY STAVKA",
      "message": "Radio intercept text",
      "priority": "FLASH"
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
        model: "gemini-3.1-flash-lite",
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
        parsed.provider = "GEMINI-3.5-FLASH-LITE";
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
    corpsDirectives: [
      {
        corpsName: "NORTHERN CORPS",
        factionId: "loyalists",
        unitsCount: 3,
        directive: "3 Armored Divisions execute sweeping pincer along River Bank",
        objective: "DELTA_BRIDGE",
        targetX: 580,
        targetY: 490
      },
      {
        corpsName: "SIERRA 1ST ARMY",
        factionId: "rebels",
        unitsCount: 3,
        directive: "2 Highland Battlegroups stage concealed ambush along Monte Oro Ridge",
        objective: "MONTE_ORO",
        targetX: 380,
        targetY: 240
      },
      {
        corpsName: "7TH EXPEDITIONARY TF",
        factionId: "coalition",
        unitsCount: 3,
        directive: "Establish amphibious perimeter and advance heavy armor toward refinery axis",
        objective: "OIL_REFINERIES",
        targetX: 640,
        targetY: 340
      },
      {
        corpsName: "8TH GUARDS SHOCK ARMY",
        factionId: "volskan",
        unitsCount: 4,
        directive: "Concentrate 152mm artillery preparation and mass armored assault west through causeway gap",
        objective: "DELTA_BRIDGE",
        targetX: 560,
        targetY: 470
      }
    ],
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
    unitOrders: (battlefield?.units || []).map((u, idx) => {
      let action: 'ATTACK' | 'FLANK' | 'DEFEND' | 'RETREAT' | 'MOVE' | 'BOMBARD' = 'MOVE';
      let targetX = u.x;
      let targetY = u.y;
      let orderText = 'HOLD POSITION';

      if (u.strength < 35) {
        action = 'RETREAT';
        targetX = u.factionId === 'loyalists' ? 240 : u.factionId === 'rebels' ? 1040 : u.factionId === 'coalition' ? 180 : 1120;
        targetY = u.factionId === 'loyalists' ? 220 : u.factionId === 'rebels' ? 620 : u.factionId === 'coalition' ? 680 : 200;
        orderText = 'FALL BACK TO SECURE DEPOT FOR REARM & MEDICAL TRIAGE';
      } else if (u.type === 'artillery') {
        action = 'BOMBARD';
        targetX = 640 + (Math.sin(tick + idx) * 120);
        targetY = 420 + (Math.cos(tick + idx) * 80);
        orderText = 'ZERO SIGHTS ON RIVER BANK AND FIRE FOR EFFECT';
      } else if (u.type === 'armor') {
        action = tick % 2 === 0 ? 'FLANK' : 'ATTACK';
        targetX = u.factionId === 'loyalists' || u.factionId === 'coalition' ? 720 : 540;
        targetY = 420 + (idx % 2 === 0 ? 100 : -100);
        orderText = action === 'FLANK' ? 'EXECUTE ARMORED PINCHER MANEUVER ON FLANK' : 'FRONTAL SPEARHEAD ADVANCE';
      } else {
        action = u.inCombat ? 'ATTACK' : 'DEFEND';
        targetX = 640 + (Math.sin(idx) * 90);
        targetY = 400 + (Math.cos(idx) * 90);
        orderText = u.inCombat ? 'ENGAGE HOSTILES IN CLOSE RANGE COMBAT' : 'DIG IN DEFENSIVE PERIMETER';
      }

      return {
        unitId: u.id,
        factionId: u.factionId,
        action,
        targetX: Math.round(targetX),
        targetY: Math.round(targetY),
        orderText
      };
    }),
    groundDirectives: [
      { factionId: "loyalists", stance: "DEFENSIVE_HOLD", objective: "SANTA_MARIA" },
      { factionId: "rebels", stance: "FLANK_AMBUSH", objective: "OIL_REFINERIES" },
      { factionId: "coalition", stance: "OFFENSIVE_THRUST", objective: "PORT_BELLA" },
      { factionId: "volskan", stance: "OFFENSIVE_THRUST", objective: "DELTA_BRIDGE" },
    ],
  };
}
