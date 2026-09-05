import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface BattleDispatchPayload {
  battleSector: string;
  victorFactionId: string;
  defeatedFactionId: string;
  victorName: string;
  defeatedName: string;
  victorLosses: number;
  defeatedLosses: number;
  airLosses?: number;
  armorLost?: number;
  commanderName?: string;
  keyIncidents?: string[];
  masthead: 'CHRONICLE' | 'VOICE_SIERRA' | 'REUTERS';
  simTime?: string;
}

export async function POST(req: NextRequest) {
  let body: BattleDispatchPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const {
    battleSector,
    victorName,
    defeatedName,
    victorLosses,
    defeatedLosses,
    airLosses = 1,
    armorLost = 4,
    commanderName = "Col. Valenzuela",
    masthead,
    simTime = "OCTOBER 1963"
  } = body;

  const mastheadPrompts = {
    CHRONICLE: {
      name: "THE SAN PIETRO CHRONICLE",
      motto: "The Voice of National Order & Sovereign Integrity — Daily Circulation 45,000",
      tone: "Strict Loyalist Junta state censorship. Downplay setbacks as 'tactical retrograde consolidations' or 'treacherous bandit ambushes orchestrated by foreign subversives'. Glorify regime heroism and declare victory even in defensive retreats."
    },
    VOICE_SIERRA: {
      name: "VOICE OF THE SIERRA — CLANDESTINE COMMUNIQUE",
      motto: "Clandestine Revolutionary Leaflet — Printed in Secret by Sierra Maestra Press Cadre",
      tone: "Romantic 1960s Marxist/National Liberation guerrilla prose. Celebrate the heroic peasant brigades, celebrate captured imperialist tanks, denounce Western puppet generals, and proclaim the inevitable socialist revolution."
    },
    REUTERS: {
      name: "INTERNATIONAL HERALD & REUTERS CABLE",
      motto: "Geneva & London Wire Service — Unbiased Global Geopolitical Intelligence",
      tone: "Crisp, factual, objective Associated Press / Reuters style. Report exact troop casualties, UN Security Council emergency deliberations, global crude oil supply disruptions from the Black Gold Refinery, and geopolitical escalation risks between Washington and Moscow."
    }
  };

  const selectedOutlet = mastheadPrompts[masthead] || mastheadPrompts.REUTERS;

  const prompt = `
You are a 1960s Cold War newspaper foreign desk editor and war correspondent.
Generate an authentic, period-accurate front-page newspaper article covering a decisive battle in the San Pietro Proxy War.

Battle Specifics:
- Sector: ${battleSector}
- Victor: ${victorName}
- Defeated: ${defeatedName}
- Casualties: ~${victorLosses} victor troops vs ~${defeatedLosses} enemy troops
- Equipment Loss: ${armorLost} tanks/mechanized destroyed, ${airLosses} combat aircraft downed
- Noted Commander in action: ${commanderName}
- Date: ${simTime}

Target Newspaper:
- Masthead: "${selectedOutlet.name}"
- Editorial Bias & Stance: ${selectedOutlet.tone}

Respond strictly in valid JSON matching this schema without code fences:
{
  "mastheadName": "${selectedOutlet.name}",
  "mastheadMotto": "${selectedOutlet.motto}",
  "headline": "PUNCHY 1960s ALL-CAPS FRONT PAGE HEADLINE (e.g. CARNAGE AT DELTA SPAN: LOYALIST ARMOR ROUTED IN NIGHT AMBUSH)",
  "subheadline": "Descriptive subtitle summarizing the tactical consequence and geopolitical fallout",
  "byline": "By [Authentic War Correspondent Name], [Location, e.g. Port Bella / Sierra Outpost / London Bureau]",
  "dateline": "OCTOBER 14, 1963 — [CITY] (SPECIAL DISPATCH)",
  "paragraphs": [
    "Opening lead paragraph setting the dramatic battlefield scene, weapon types (M48 Pattons, T-54s, S-75 Dvina SAMs, Napalm), and the outcome.",
    "Second paragraph detailing commander maneuvers, the breakthrough or defensive stand, and tactical casualties.",
    "Third paragraph analyzing the wider Cold War repercussions, oil pipeline flow, diplomatic cables, or superpowers' naval alert levels."
  ],
  "keyBulletins": [
    "Casualty bulletin line",
    "Air / Armor destruction bulletin",
    "Frontline border shift status"
  ],
  "propagandaAngle": "Brief 1-sentence description of the bias reflected in this dispatch",
  "editorialSketchDesc": "Description of the front-page tactical arrow map sketch or grainy black-and-white field photograph",
  "oilPriceShift": "+$1.85 / barrel (Gulf crude index spikes)",
  "unSecurityCouncilReaction": "Emergency closed-door session convened in New York at request of Non-Aligned delegates."
}
`;

  // Use Gemini 3.5 Flash Lite (gemini-3.1-flash-lite)
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
          temperature: 0.75,
        },
      });

      if (response && response.text) {
        let cleanText = response.text.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        const article = JSON.parse(cleanText);
        article.model = "GEMINI-3.5-FLASH-LITE";
        return NextResponse.json(article);
      }
    } catch (err) {
      console.warn("Newspaper Gemini generation failed, using period fallback:", err);
    }
  }

  // Authentic 1960s Fallback Dispatch
  const fallbackByMasthead = {
    CHRONICLE: {
      headline: `HEROIC FORCES REPEL TERRORIST INCURSION AT ${battleSector.toUpperCase()}`,
      subheadline: `Presidential Guard Consolidates Fortress Positions Following Treacherous Night Assault; Enemy Foreign Brigades Suffer Devastating Attrition`,
      byline: "By Eduardo Morazán, Chief Military Correspondent, San Pietro Presidential Press Office",
      dateline: `OCTOBER 1963 — SANTA MARIA CITADEL (OFFICIAL COMMUNIQUE)`,
      paragraphs: [
        `In the early morning mist over ${battleSector}, the brave mechanized regiments of the Republic stood fast against overwhelming waves of guerrilla mercenaries equipped with clandestine foreign rocketry. General Staff confirmed our fortified armor lines inflicted catastrophic losses upon the subversive elements before completing an orderly tactical realignment.`,
        `Under intense artillery fire directed by ${commanderName}, our frontline garrisons neutralized ${defeatedLosses} extremist insurgents and pulverized hostile armor columns. Eyewitness accounts report our anti-aircraft batteries successfully intercepted incoming hostile air strikes, demonstrating the iron resolve of the sovereign armed forces.`,
        `The Ministry of the Interior issued an emergency decree reassuring the civilian population that Port Bella and the Black Gold oil terminals remain secure under martial law. Rumors of territorial withdrawal circulated by pirate radio stations were denounced as treasonous fabrications.`
      ],
      keyBulletins: [
        `Loyalist Losses: Nominal defensive casualties (${victorLosses} reported)`,
        `Insurgent Losses: Over ${defeatedLosses} enemy cadres neutralized with heavy armor losses`,
        `Frontline: Strategic defensive perimeter at ${battleSector} reinforced under martial authority`
      ],
      propagandaAngle: "State-censored narrative glorifying defensive actions and attributing setbacks to hostile foreign intelligence.",
      editorialSketchDesc: "High-contrast photograph of Presidential Guard M48 Patton tank crew standing vigilantly beside sandbagged redoubts under the San Pietro flag.",
      oilPriceShift: "Domestic fuel rationing enforced; state crude exports protected under naval convoy.",
      unSecurityCouncilReaction: "Foreign Minister submits formal protest to UN against Atlantic and Volskan territorial meddling."
    },
    VOICE_SIERRA: {
      headline: `PEOPLE'S BRIGADES SMASH REACTIONARY FORCES AT ${battleSector.toUpperCase()}!`,
      subheadline: `Guerilla Columns Encircle Junta Battalions in Audacious Mountain Maneuver; Imperialist Tanks Captured Intact for the People's Arsenal`,
      byline: "By Comandante Mateo, Field Reporter for Clandestine Radio Cadre Sierra Libre",
      dateline: `OCTOBER 1963 — GUERRILLA LIBERATION COMMAND POST (VIA COURIER)`,
      paragraphs: [
        `Comrades and workers of San Pietro! Before dawn today, our 3rd People's Vanguard struck a historic blow against the corrupt military dictatorship at ${battleSector}. Descending through the rain-soaked mountain ridges, our partisan cadres cut the enemy's logistical artery and shattered their armored spearhead in three hours of fierce fighting.`,
        `The reactionary officers under ${commanderName} fled in disarray, abandoning ${armorLost} armored fighting vehicles and stockpiles of Western-supplied munitions to our advancing fighters. Our sharpshooters and RPG teams held the causeway against relentless counterattacks, liberating the surrounding peasant villages from military tyranny.`,
        `Let Washington and the junta oligarchs take heed: no amount of foreign napalm or dollar subsidies can extinguish the fire of national sovereignty. The road to Santa Maria is open, and the revolutionary high command summons all youth to join the liberated frontlines!`
      ],
      keyBulletins: [
        `People's Front: Minimal casualties (${victorLosses} martyrs honored)`,
        `Dictatorship: ${defeatedLosses} troops captured or routed; major hardware seized`,
        `Liberated Zone: Full partisan control proclaimed across ${battleSector}`
      ],
      propagandaAngle: "Romantic revolutionary rhetoric celebrating heroic peasant guerrilla victory over oppressive imperialist machinery.",
      editorialSketchDesc: "Woodcut-style silhouette print of guerrilla partisans raising their rifles atop a captured armored column overlooking the river valley.",
      oilPriceShift: "Guerrilla decree orders expropriation of foreign-owned extraction wells for the public trust.",
      unSecurityCouncilReaction: "Solidarity declarations telegraphed from Non-Aligned and Socialist youth congresses worldwide."
    },
    REUTERS: {
      headline: `BLOODY CLASH AT ${battleSector.toUpperCase()}: FORCES COLLIDE AS CEASEFIRE DISSOLVES`,
      subheadline: `Heavy Artillery & Close Air Support Decimate Strategic Crossing; Over ${victorLosses + defeatedLosses} Casualties Reported as Superpowers Weigh Direct Escalation`,
      byline: "By Arthur Henderson, Associated Press War Correspondent, Port Bella",
      dateline: `OCTOBER 1963 — PORT BELLA (SPECIAL CABLE VIA RADIO-TELEGRAPH)`,
      paragraphs: [
        `The delicate truce along the San Pietro demarcation line collapsed in fire and cordite today as ${victorName} launched a massive assault against fortified positions held by ${defeatedName} at ${battleSector}. Heavy 152mm howitzers and napalm strikes turned the causeway into a smoking graveyard of twisted armor and burning supply trucks.`,
        `Field reports indicate that units commanded by ${commanderName} spearheaded the thrust, exploiting a fatal gap in enemy logistical lines that left frontline units starved of fuel and ammunition. Military observers in Port Bella confirm ${armorLost} main battle tanks were incinerated and at least ${airLosses} aircraft brought down by surface-to-air missile batteries.`,
        `The strategic ramifications were instantaneous: crude oil pipeline valves feeding the Black Gold refinery were shut down, driving Rotterdam spot market prices up sharply. In New York, the UN Security Council convened an emergency late-night session, while Seventh Fleet carrier task forces in the Atlantic were placed on heightened DEFCON 2 readiness.`
      ],
      keyBulletins: [
        `Casualties: Estimated ${victorLosses} victor troops / ${defeatedLosses} defending troops`,
        `Materiel: ${armorLost} armored fighting vehicles lost; ${airLosses} combat aircraft downed`,
        `Strategic Status: Control of ${battleSector} severed; oil transport through corridor halted`
      ],
      propagandaAngle: "Objective, neutral, and data-driven analysis highlighting diplomatic, economic, and superpower proxy risks.",
      editorialSketchDesc: "Grainy black-and-white aerial reconnaissance photograph showing cratered bridge viaduct and burning tank hulls with tactical retreat arrows.",
      oilPriceShift: "+$2.15 per barrel; tanker insurance rates doubled in Caribbean basin.",
      unSecurityCouncilReaction: "UN Secretary-General calls for immediate disengagement; Soviet and US ambassadors trade accusations of treaty violation."
    }
  };

  const article = fallbackByMasthead[masthead] || fallbackByMasthead.REUTERS;
  return NextResponse.json({
    mastheadName: selectedOutlet.name,
    mastheadMotto: selectedOutlet.motto,
    headline: article.headline,
    subheadline: article.subheadline,
    byline: article.byline,
    dateline: article.dateline,
    paragraphs: article.paragraphs,
    keyBulletins: article.keyBulletins,
    propagandaAngle: article.propagandaAngle,
    editorialSketchDesc: article.editorialSketchDesc,
    oilPriceShift: article.oilPriceShift,
    unSecurityCouncilReaction: article.unSecurityCouncilReaction,
    model: "1960S-HISTORICAL-INTELLIGENCE-DISPATCH"
  });
}
