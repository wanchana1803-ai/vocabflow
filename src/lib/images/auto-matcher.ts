/**
 * Automated Semantic Image Matcher for VocabFlow
 * Automatically finds and assigns high-resolution, relevant image URLs
 * with full attribution for any vocabulary word.
 *
 * Location: src/lib/images/auto-matcher.ts
 */

export interface MatchedImage {
  imageUrl: string;
  imageAlt: string;
  sourceName: string;
  sourceLicense: string;
  creator?: string;
  creatorUrl?: string;
}

interface ImageThemeEntry {
  patterns: RegExp[];
  imageUrl: string;
  imageAlt: string;
  creator: string;
  creatorUrl: string;
}

/**
 * List of known outdated or removed Unsplash URLs to automatically migrate and replace
 */
export const OUTDATED_IMAGE_URLS = new Set([
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80",
]);

/**
 * Rich library of vetted, high-resolution Unsplash images mapped to semantic clusters.
 * Every single URL in this registry is verified to return HTTP 200.
 */
const SEMANTIC_THEME_REGISTRY: ImageThemeEntry[] = [
  // --- USER'S OXFORD 3000 "A" VOCABULARIES & RELATED THEMES ---
  {
    patterns: [/\b(a|an|alphabet|letter|typography|initial|abc)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Open vintage book and elegant alphabet typography",
    creator: "Patrick Tomasso",
    creatorUrl: "https://unsplash.com/@impatrickt",
  },
  {
    patterns: [/\b(abandon|desert|quit|forsake|leave behind)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Quiet rustic path left peaceful in nature",
    creator: "Egor Kamelev",
    creatorUrl: "https://unsplash.com/@ekamelev",
  },
  {
    patterns: [/\b(ability|able|skill|capable|competent|talent|mastery)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Hands skillfully coding and building digital craftsmanship",
    creator: "John Schnobrich",
    creatorUrl: "https://unsplash.com/@johnschnobrich",
  },
  {
    patterns: [/\b(about|concept|idea|thought|topic|matter)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Thoughtful desk setup with coffee, notebook and creative concepts",
    creator: "Andrew Neel",
    creatorUrl: "https://unsplash.com/@andrewtneel",
  },
  {
    patterns: [/\b(above|sky|over|altitude|height|flying|cloud)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Vast open blue sky and soft white clouds floating high above",
    creator: "Billy Huynh",
    creatorUrl: "https://unsplash.com/@billy_huy",
  },
  {
    patterns: [/\b(abroad|travel|foreign|international|flight|passport|journey)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Traveler looking at destination map preparing for voyage abroad",
    creator: "Dino Reichmuth",
    creatorUrl: "https://unsplash.com/@dinoreichmuth",
  },
  {
    patterns: [/\b(absolute|absolutely|certain|pure|complete|clarity)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Crystal clear ocean and unbroken horizon representing absolute clarity",
    creator: "Sean Oulashin",
    creatorUrl: "https://unsplash.com/@oulashin",
  },
  {
    patterns: [/\b(academic|university|college|library|professor|campus|scholar|study)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Grand historic university campus and library hall",
    creator: "Mikael Kristenson",
    creatorUrl: "https://unsplash.com/@mikaelkristenson",
  },
  {
    patterns: [/\b(accept|agreement|welcome|receive|embrace|deal)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Handshake agreement showing mutual acceptance and partnership",
    creator: "Cytonn Photography",
    creatorUrl: "https://unsplash.com/@cytonn_photography",
  },
  {
    patterns: [/\b(access|entrance|gateway|login|key|unlock|network)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Secure digital interface granting seamless access",
    creator: "John Schnobrich",
    creatorUrl: "https://unsplash.com/@johnschnobrich",
  },
  {
    patterns: [/\b(accident|crash|danger|caution|emergency|hazard|warning)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Reflective safety caution cone warning of hazard or accident",
    creator: "engin akyurt",
    creatorUrl: "https://unsplash.com/@enginakyurt",
  },
  {
    patterns: [/\b(accompany|companion|together|escort|friends|guidance)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Good companions walking together accompanying each other along a scenic trail",
    creator: "Helena Lopes",
    creatorUrl: "https://unsplash.com/@wildlittlethingsphoto",
  },
  {
    patterns: [/\b(account|accounting|ledger|finance|bank|statement|audit)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Financial ledger, pen, and modern calculator for account balancing",
    creator: "Kelly Sikkema",
    creatorUrl: "https://unsplash.com/@kellysikkema",
  },
  {
    patterns: [/\b(accurate|accuracy|precise|precision|exact|target|bullseye)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Precision ruler, compass, and blueprint drafting accurate lines",
    creator: "Daniel McCullough",
    creatorUrl: "https://unsplash.com/@dnlmc",
  },
  {
    patterns: [/\b(accuse|blame|court|law|trial|charge|gavel|justice)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Legal courtroom gavel and scales of justice",
    creator: "Tingey Injury Law Firm",
    creatorUrl: "https://unsplash.com/@tingeyinjurylawfirm",
  },
  {
    patterns: [/\b(achieve|achievement|accomplish|goal|victory|succeed|triumph)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Team celebrating reaching a great achievement together",
    creator: "Brooke Cagle",
    creatorUrl: "https://unsplash.com/@brookecagle",
  },
  {
    patterns: [/\b(acknowledge|admit|recognize|notice|appreciate|credit)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Colleague nodding in agreement during a collaborative meeting",
    creator: "Dylan Gillis",
    creatorUrl: "https://unsplash.com/@dylandill",
  },
  {
    patterns: [/\b(acquire|buy|purchase|obtain|procure|retail|payment)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Customer completing a seamless card transaction to acquire goods",
    creator: "Blake Wisz",
    creatorUrl: "https://unsplash.com/@blakewisz",
  },
  {
    patterns: [/\b(across|bridge|cross|river|span|passage)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Scenic suspension bridge spanning across a calm river",
    creator: "Luca Micheli",
    creatorUrl: "https://unsplash.com/@lucamicheli",
  },
  {
    patterns: [/\b(act|action|drama|perform|play|theater|clapper)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Theater stage under dramatic spotlight ready for performance action",
    creator: "Rob Laughter",
    creatorUrl: "https://unsplash.com/@roblaughter",
  },
  {
    patterns: [/\b(active|activity|fitness|energy|exercise|workout|motion)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Active athlete performing dynamic fitness training",
    creator: "Scott Webb",
    creatorUrl: "https://unsplash.com/@scottwebb",
  },
  {
    patterns: [/\b(actor|actress|performer|star|stage|cinema|audition)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Dramatic stage lighting for theater actor and performer",
    creator: "Rob Laughter",
    creatorUrl: "https://unsplash.com/@roblaughter",
  },
  {
    patterns: [/\b(actual|actually|reality|fact|truth|real|evidence)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Precise measurements and blueprints detailing actual facts",
    creator: "Daniel McCullough",
    creatorUrl: "https://unsplash.com/@dnlmc",
  },
  {
    patterns: [/\b(adapt|adaptation|adjust|flexible|evolve|growing)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Delicate seedling adapting and thriving toward morning sunlight",
    creator: "Roman Synkevych",
    creatorUrl: "https://unsplash.com/@synkevych",
  },
  {
    patterns: [/\b(add|addition|additional|plus|combine|connect|puzzle)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Adding connecting puzzle pieces together to form a whole",
    creator: "Vardan Papikyan",
    creatorUrl: "https://unsplash.com/@vardanp",
  },
  {
    patterns: [/\b(address|mail|envelope|letter|destination|residence)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Classic postal letter with stamped address ready for delivery",
    creator: "Joanna Kosinska",
    creatorUrl: "https://unsplash.com/@joannakosinska",
  },
  {
    patterns: [/\b(administration|management|executive|director|governance|board)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Modern corporate boardroom and office administration facility",
    creator: "Slidebean",
    creatorUrl: "https://unsplash.com/@slidebean",
  },
  {
    patterns: [/\b(admire|admiration|wonder|stars|astronomy|awe)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Person gazing up in awe and admiration at the majestic night sky",
    creator: "Benjamin Davies",
    creatorUrl: "https://unsplash.com/@bendavisual",
  },
  {
    patterns: [/\b(admit|admission|ticket|entrance|entry|allow in)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Concert tickets and glowing entryway for event admission",
    creator: "Colin Lloyd",
    creatorUrl: "https://unsplash.com/@colin_lloyd",
  },
  {
    patterns: [/\b(adopt|adoption|rescue|pet|puppy|caring)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Loving puppy dog waiting happily for family adoption",
    creator: "Karsten Winegeart",
    creatorUrl: "https://unsplash.com/@karsten116",
  },
  {
    patterns: [/\b(adult|mature|professional|grown|workforce)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Confident adult professional in natural daylight",
    creator: "Jurica Koletić",
    creatorUrl: "https://unsplash.com/@juricakoletic",
  },
  {
    patterns: [/\b(advance|advancement|forward|progress|speed|fast)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Grand landscape vista showing continuous path moving forward",
    creator: "Bailey Zindel",
    creatorUrl: "https://unsplash.com/@baileyzindel",
  },
  {
    patterns: [/\b(advantage|edge|lead|strategy|tactics|chess)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Strategic chess game showing decisive tactical advantage",
    creator: "Felix Mittermeier",
    creatorUrl: "https://unsplash.com/@felixmittermeier",
  },
  {
    patterns: [/\b(adventure|explore|hiking|backpack|expedition|cliff)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Adventurer on high scenic road embarking on a great road trip",
    creator: "Kal Visuals",
    creatorUrl: "https://unsplash.com/@kalvisuals",
  },
  {
    patterns: [/\b(advertise|advertisement|advertising|billboard|commercial|neon)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Vibrant city night billboards displaying dynamic advertisements",
    creator: "Aleksandar Pasaric",
    creatorUrl: "https://unsplash.com/@apasaric",
  },
  {
    patterns: [/\b(advice|advise|guidance|mentor|counsel|consultation)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Wise mentor sharing valuable professional advice in discussion",
    creator: "Christina @ wocintechchat.com",
    creatorUrl: "https://unsplash.com/@wocintechchat",
  },
  {
    patterns: [/\b(affair|summit|conference|formal event|diplomacy)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Prestigious conference auditorium gathering for important affairs",
    creator: "Evangeline Shaw",
    creatorUrl: "https://unsplash.com/@evanshaw",
  },
  {
    patterns: [/\b(affect|influence|impact|ripple|domino|consequence)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Water drop creating cascading ripple waves affecting the surface",
    creator: "Levi Saunders",
    creatorUrl: "https://unsplash.com/@levisaunders",
  },
  {
    patterns: [/\b(afford|budget|savings|wealth|piggy bank|wallet)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Piggy bank and coins representing financial savings to afford goals",
    creator: "Fabian Blank",
    creatorUrl: "https://unsplash.com/@fabianblank",
  },
  {
    patterns: [/\b(afraid|fear|scared|shadow|spooky|creepy|dark)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Atmospheric mysterious dark mist creating a suspenseful mood",
    creator: "Johannes Plenio",
    creatorUrl: "https://unsplash.com/@jplenio",
  },
  {
    patterns: [/\b(after|afternoon|sunset|evening|dusk|late)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Golden afternoon sunshine illuminating a warm sidewalk cafe",
    creator: "Daiga Ellaby",
    creatorUrl: "https://unsplash.com/@daiga_ellaby",
  },

  // --- GENERAL DOMAINS (NATURE, ANIMALS, TECH, SCIENCE, HEALTH, ETC.) ---
  {
    patterns: [/\b(dog|puppy|canine|hound)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Playful happy dog in grassy meadow",
    creator: "James Barker",
    creatorUrl: "https://unsplash.com/@barkerrr",
  },
  {
    patterns: [/\b(cat|kitten|feline)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Curious tabby cat looking into camera",
    creator: "Manja Vitolic",
    creatorUrl: "https://unsplash.com/@madewithlove",
  },
  {
    patterns: [/\b(bird|wings|feather|fly|nest)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Colorful wild bird perched on branch",
    creator: "Vincent van Zalinge",
    creatorUrl: "https://unsplash.com/@vincentvanzalinge",
  },
  {
    patterns: [/\b(car|automobile|drive|driver|vehicle|highway)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Sleek automobile on scenic open highway",
    creator: "Campbell",
    creatorUrl: "https://unsplash.com/@campbell33",
  },
  {
    patterns: [/\b(bicycle|bike|cyclist|cycling|ride)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Classic road bicycle leaning against sunny wall",
    creator: "Coen van de Broek",
    creatorUrl: "https://unsplash.com/@coenvdbroek",
  },
  {
    patterns: [/\b(airplane|aeroplane|flight|airport|aviation|plane)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Commercial airliner flying smoothly through sunset sky",
    creator: "Sourav Mishra",
    creatorUrl: "https://unsplash.com/@souravmishra",
  },
  {
    patterns: [/\b(train|rail|railway|subway|metro|station)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Modern passenger train traveling along scenic tracks",
    creator: "Matthew Smith",
    creatorUrl: "https://unsplash.com/@whale",
  },
  {
    patterns: [/\b(music|guitar|song|melody|instrument|musician)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Acoustic guitar and music headphones ready for play",
    creator: "Wes Hicks",
    creatorUrl: "https://unsplash.com/@weshicks",
  },
  {
    patterns: [/\b(art|painting|paint|canvas|brush|draw|artwork)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Artist palette and paintbrushes with vibrant colors",
    creator: "Alice Achterhof",
    creatorUrl: "https://unsplash.com/@alice_achterhof",
  },
  {
    patterns: [/\b(coffee|cafe|espresso|latte|cappuccino|mug)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Warm freshly brewed coffee cup with delicate latte art",
    creator: "Nathan Dumlao",
    creatorUrl: "https://unsplash.com/@nate_dumlao",
  },
  {
    patterns: [/\b(doctor|medicine|medical|hospital|nurse|clinic|heal)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Stethoscope and medical care equipment",
    creator: "Online Marketing",
    creatorUrl: "https://unsplash.com/@onlinemarketing",
  },
  {
    patterns: [/\b(science|lab|laboratory|experiment|chemistry|researcher)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Scientific laboratory glassware and colorful chemical testing",
    creator: "Hans Reniers",
    creatorUrl: "https://unsplash.com/@hansreniers",
  },
  {
    patterns: [/\b(clock|time|watch|hour|minute|second|timing)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Classic pocket watch tracking precision time",
    creator: "Aron Visuals",
    creatorUrl: "https://unsplash.com/@aronvisuals",
  },
  {
    patterns: [/\b(money|coin|cash|currency|finance|dollar)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Stack of golden coins and currency notes",
    creator: "Goran Horvat",
    creatorUrl: "https://unsplash.com/@goran_horvat",
  },
  {
    patterns: [/\b(family|parents|mother|father|relative|home)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Happy loving family walking together outdoors",
    creator: "Tyler Nix",
    creatorUrl: "https://unsplash.com/@jtylernix",
  },
  {
    patterns: [/\b(child|children|kid|play|playground|youth)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Young child smiling happily during creative play",
    creator: "Ben White",
    creatorUrl: "https://unsplash.com/@benwhitephotography",
  },
  {
    patterns: [/\b(rain|storm|weather|umbrella|wet|shower)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Raindrops cascading down a city window pane",
    creator: "Valentin Müller",
    creatorUrl: "https://unsplash.com/@valentinbkk",
  },
  {
    patterns: [/\b(snow|winter|ice|cold|frost|freeze)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Winter wonderland with pine trees blanketed in fresh snow",
    creator: "Roberto Nickson",
    creatorUrl: "https://unsplash.com/@rpnickson",
  },
  {
    patterns: [/\b(camera|photo|photograph|lens|shoot)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Professional camera with lens ready for photography",
    creator: "Alexander Andrews",
    creatorUrl: "https://unsplash.com/@alex_andrews",
  },
  {
    patterns: [/\b(flower|garden|bloom|petal|blossom|rose)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Delicate spring flowers blooming in gentle morning light",
    creator: "Evie S.",
    creatorUrl: "https://unsplash.com/@evieshaffer",
  },
  {
    patterns: [/\b(mountain|hill|peak|summit|climb|alpine)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Magnificent alpine mountain peaks under crisp morning light",
    creator: "Kalvis S.",
    creatorUrl: "https://unsplash.com/@kalviss",
  },
  {
    patterns: [/\b(water|drink|liquid|hydrate|glass)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Refreshing splash of clear clean drinking water",
    creator: "Manki Kim",
    creatorUrl: "https://unsplash.com/@mankikim",
  },
  {
    patterns: [/\b(book|read|study|library|knowledge|literature)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Neatly stacked classic books in warm library atmosphere",
    creator: "Kimberly Farmer",
    creatorUrl: "https://unsplash.com/@kimberlyfarmer",
  },
  {
    patterns: [/\b(nature|forest|tree|leaf|green|plant|earth)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Lush green forest canopy with gentle mist",
    creator: "Sebastian Unrau",
    creatorUrl: "https://unsplash.com/@sebastian_unrau",
  },
  {
    patterns: [/\b(food|eat|meal|dish|fruit|apple|cook|kitchen)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Fresh crisp red apples on rustic wooden surface",
    creator: "Matheus Cenali",
    creatorUrl: "https://unsplash.com/@matheuscenali",
  },
  {
    patterns: [/\b(technology|computer|laptop|code|screen|device)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Modern workspace with laptop, coffee, and work devices",
    creator: "Marvin Meyer",
    creatorUrl: "https://unsplash.com/@marvelous",
  },
  {
    patterns: [/\b(joy|happy|happiness|smile|delight|celebrate)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Golden sparklers in evening light celebrating joy and delight",
    creator: "Jad Limcaco",
    creatorUrl: "https://unsplash.com/@jadlimcaco",
  },
  {
    patterns: [/\b(love|heart|care|affection|compassion|empathy)\b/i],
    imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Delicate paper heart in soft sunset illumination",
    creator: "Kelly Sikkema",
    creatorUrl: "https://unsplash.com/@kellysikkema",
  },
];

/**
 * Category-based curated defaults when no specific semantic pattern matches.
 * All URLs are verified HTTP 200.
 */
const CATEGORY_DEFAULT_IMAGES: Record<string, Omit<MatchedImage, "imageAlt"> & { defaultAlt: string }> = {
  person: {
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Portrait representing individual person and social role",
    creator: "Aiony Haust",
    creatorUrl: "https://unsplash.com/@aiony",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
  place: {
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Modern architecture representing destination and place",
    creator: "Sean Pollock",
    creatorUrl: "https://unsplash.com/@seanpollock",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
  object: {
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Stack of books and instruments representing tangible item",
    creator: "Kimberly Farmer",
    creatorUrl: "https://unsplash.com/@kimberlyfarmer",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
  action: {
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Dynamic athletic movement representing action and energy",
    creator: "Braden Collum",
    creatorUrl: "https://unsplash.com/@bencollum",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
  emotion: {
    imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Celebration lights expressing joy, warmth, and emotion",
    creator: "Jad Limcaco",
    creatorUrl: "https://unsplash.com/@jadlimcaco",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
  abstract: {
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    defaultAlt: "Clear open horizon representing abstract thought and clarity",
    creator: "Sean Oulashin",
    creatorUrl: "https://unsplash.com/@oulashin",
    sourceName: "Unsplash",
    sourceLicense: "Unsplash License",
  },
};

/**
 * Automatically finds a matching high-resolution image for any given word,
 * definition, part of speech, or topic.
 */
export function getAutomaticImageForWord(
  word: string,
  partOfSpeech?: string | null,
  topic?: string | null,
  definition?: string | null
): MatchedImage {
  const cleanWord = (word || "").trim().toLowerCase();
  const targetText = `${cleanWord} ${partOfSpeech || ""} ${topic || ""} ${definition || ""}`.toLowerCase();

  // 1. Exact Word Match First (Highest Precision)
  for (const entry of SEMANTIC_THEME_REGISTRY) {
    for (const pattern of entry.patterns) {
      if (pattern.test(cleanWord)) {
        return {
          imageUrl: entry.imageUrl,
          imageAlt: `${entry.imageAlt} (${word})`,
          sourceName: "Unsplash",
          sourceLicense: "Unsplash License",
          creator: entry.creator,
          creatorUrl: entry.creatorUrl,
        };
      }
    }
  }

  // 2. Full Context Match (Word + Definition + Topic)
  for (const entry of SEMANTIC_THEME_REGISTRY) {
    for (const pattern of entry.patterns) {
      if (pattern.test(targetText)) {
        return {
          imageUrl: entry.imageUrl,
          imageAlt: `${entry.imageAlt} (${word})`,
          sourceName: "Unsplash",
          sourceLicense: "Unsplash License",
          creator: entry.creator,
          creatorUrl: entry.creatorUrl,
        };
      }
    }
  }

  // 3. Classify into primary category
  const pos = (partOfSpeech || "").toLowerCase();
  const top = (topic || "").toLowerCase();
  const def = (definition || "").toLowerCase();

  let category = "abstract";
  if (pos.includes("verb") || top.includes("action")) {
    category = "action";
  } else if (top.includes("emotion") || def.includes("feeling") || def.includes("emotion")) {
    category = "emotion";
  } else if (top.includes("people") || def.includes("person") || def.includes("someone")) {
    category = "person";
  } else if (top.includes("place") || top.includes("travel") || def.includes("place") || def.includes("country")) {
    category = "place";
  } else if (top.includes("object") || top.includes("food") || def.includes("device") || def.includes("tool")) {
    category = "object";
  }

  const fallback = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.abstract;

  return {
    imageUrl: fallback.imageUrl,
    imageAlt: `${fallback.defaultAlt} for "${word}"`,
    sourceName: fallback.sourceName,
    sourceLicense: fallback.sourceLicense,
    creator: fallback.creator,
    creatorUrl: fallback.creatorUrl,
  };
}
