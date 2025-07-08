
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Keyboard, Heart, Trophy, Play, Pause, RotateCw, ArrowLeft, Loader2, Star as StarIcon, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";
import { applyRewards, calculateRewards } from "@/lib/rewards";
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TypingRushGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

interface FallingObject {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // pixels
  speed: number;
  status: 'falling' | 'bursting';
  color: string;
}

const MEDIUM_WORDS = ["cat", "dog", "sun", "sky", "run", "joy", "fun", "key", "box", "cup", "art", "big", "car", "day", "eat", "fly", "get", "hat", "ice", "jam", "kit", "leg", "map", "net", "owl", "pen", "red", "sit", "ten", "use", "vet", "win", "zip", "act", "add", "aim", "age", "air", "ale", "ant", "ape", "arm", "ask", "axe", "bag", "bat", "bed", "bee", "beg", "bet", "buy", "cab", "can", "cap", "cow", "cry", "cub", "cup", "cut", "dad", "den", "did", "die", "dig", "dip", "doe", "dog", "dot", "dry", "dug", "ear", "egg", "ego", "end", "eye", "fan", "fat", "fed", "fee", "few", "fig", "fin", "fit", "fix", "fly", "foe", "fog", "for", "fox", "fun", "fur", "gas", "gem", "get", "god", "gum", "gun", "gut", "guy", "gym", "ham", "hat", "hen", "her", "hey", "him", "hip", "his", "hit", "hot", "how", "hug", "hum", "hut", "ice", "ill", "ink", "ion", "its", "jar", "jaw", "jet", "job", "jog", "joy", "jug", "kid", "kin", "kit", "lab", "lad", "lap", "law", "lay", "led", "leg", "let", "lie", "lip", "log", "lot", "low", "mad", "man", "map", "mat", "men", "met", "mix", "mob", "mop", "mud", "mug", "nab", "nag", "nap", "net", "new", "nod", "not", "now", "nun", "nut", "oak", "oar", "oat", "odd", "off", "oil", "old", "one", "own", "pad", "pal", "pan", "par", "pat", "paw", "pay", "pea", "peg", "pen", "pet", "pie", "pig", "pin", "pit", "pod", "pop", "pot", "pro", "pub", "pug", "pun", "pup", "put", "rag", "ram", "ran", "rap", "rat", "raw", "ray", "red", "rib", "rid", "rig", "rim", "rip", "rob", "rod", "rot", "row", "rub", "rug", "rum", "run", "rye", "sad", "sag", "sap", "sat", "saw", "say", "see", "set", "sew", "she", "shy", "sin", "sip", "sir", "sit", "ski", "sky", "sly", "son", "sow", "soy", "spa", "spy", "sub", "sue", "sum", "sun", "sup", "tab", "tag", "tan", "tap", "tar", "tax", "tea", "ten", "the", "tie", "tin", "tip", "toe", "tom", "ton", "top", "tow", "toy", "try", "tub", "tug", "two", "use", "van", "vet", "wad", "wag", "war", "was", "wax", "way", "web", "wed", "wee", "wet", "who", "why", "wig", "win", "wit", "won", "wow", "yak", "yam", "yap", "yes", "yet", "you", "zip", "zoo", "able", "acid", "also", "aunt", "away", "baby", "back", "bake", "ball", "band", "bank", "bare", "bark", "base", "bath", "bean", "bear", "beat", "beef", "been", "bell", "belt", "bend", "best", "bike", "bird", "bite", "blow", "blue", "boat", "body", "boil", "bold", "bone", "book", "boom", "boot", "born", "boss", "both", "bowl", "boys", "burn", "bush", "busy", "buy", "cake", "call", "calm", "came", "camp", "card", "care", "cart", "case", "cash", "cast", "cave", "cell", "cent", "chat", "chef", "chew", "chin", "chip", "city", "clam", "clan", "clap", "claw", "clay", "clip", "club", "coal", "coat", "coax", "cock", "coin", "coke", "cold", "colt", "comb", "come", "cone", "cook", "cool", "copy", "cord", "core", "cork", "corn", "cost", "cove", "cowl", "cozy", "crab", "cram", "crew", "crib", "crop", "crow", "cube", "cuff", "cult", "curb", "cure", "curl", "cute", "dark", "dart", "dash", "data", "date", "dawn", "days", "dead", "deaf", "deal", "dean", "dear", "debt", "deck", "deed", "deep", "deer", "defy", "demo", "dent", "deny", "desk", "dial", "dice", "died", "diet", "dime", "dine", "dirt", "dish", "disk", "diva", "dive", "dock", "dodo", "doer", "doll", "dolt", "dome", "done", "doom", "door", "dope", "dork", "dorm", "dose", "dote", "dove", "down", "doze", "drag", "draw", "drew", "drip", "drop", "drug", "drum", "duck", "duct", "dude", "duel", "duet", "duke", "dull", "dumb", "dump", "dune", "dunk", "dusk", "dust", "duty", "each", "earn", "ears", "ease", "east", "easy", "echo", "edge", "edgy", "edit", "exit", "face", "fact", "fade", "fail", "fair", "fake", "fall", "fame", "fang", "fare", "farm", "fast", "fate", "fawn", "fear", "feat", "feed", "feel", "feet", "fell", "felt", "fern", "feud", "file", "fill", "film", "find", "fine", "fink", "fire", "firm", "fish", "fist", "five", "fizz", "flag", "flak", "flap", "flat", "flaw", "flea", "fled", "flee", "flew", "flex", "flip", "flit", "flop", "flow", "flux", "foal", "foam", "foci", "foil", "fold", "folk", "fond", "font", "food", "fool", "foot", "foul", "four", "fowl", "foxy", "fray", "free", "fret", "frog", "from", "fuel", "full", "fume", "fund", "funk", "fury", "fuse", "fuss", "fuzz", "gaff", "gait", "gala", "gale", "gall", "game", "gamy", "gang", "gape", "garb", "gash", "gasp", "gate", "gave", "gawk", "gaze", "gear", "geek", "geld", "gene", "gent", "germ", "gift", "gild", "gill", "gilt", "girl", "gist", "give", "glad", "glee", "glen", "glib", "glob", "glow", "glue", "glum", "glut", "gnat", "gnaw", "goad", "goal", "goat", "goes", "gold", "golf", "gone", "gong", "good", "goof", "goon", "goop", "gore", "gory", "gosh", "gout", "gown", "grab", "grad", "gram", "gray", "grew", "grey", "grid", "grim", "grin", "grip", "grit", "grow", "grub", "gull", "gulp", "gunk", "guru", "gush", "gust", "guts", "hack", "hail", "hair", "hake", "hale", "half", "hall", "halo", "halt", "hand", "hang", "hard", "hark", "harm", "harp", "hash", "hasp", "hate", "haul", "have", "hawk", "haze", "hazy", "head", "heal", "heap", "hear", "heat", "heck", "heed", "heel", "heft", "heir", "held", "hell", "helm", "help", "hemp", "herb", "herd", "here", "hero", "hers", "hick", "hide", "high", "hike", "hill", "hilt", "hind", "hint", "hire", "hiss", "hive", "hoax", "hobo", "hold", "hole", "holy", "home", "homy", "hone", "honk", "hood", "hoof", "hook", "hoop", "hoot", "hope", "horn", "hose", "host", "hour", "hove", "howl", "huff", "huge", "hula", "hulk", "hull", "hump", "hung", "hunk", "hunt", "hurl", "hurt", "hush", "husk", "hymn", "hype", "icon", "idea", "idle", "idly", "idol", "iffy", "inch", "info", "into", "iota", "iron", "isle", "itch", "item", "ivory", "jack", "jade", "jail", "jamb", "jape", "java", "jazz", "jeep", "jeer", "jell", "jerk", "jest", "jibe", "jiff", "jigs", "jilt", "jinx", "jive", "jock", "join", "joke", "joky", "jolt", "josh", "jowl", "joys", "judo", "juju", "juke", "july", "jump", "june", "junk", "jury", "just", "jute", "kale", "kart", "keel", "keen", "keep", "kelp", "kept", "kick", "kill", "kiln", "kilo", "kilt", "kind", "king", "kink", "kiss", "kite", "kits", "kiwi", "knee", "knew", "knit", "knob", "knot", "know", "koan", "kudo", "lace", "lack", "lacy", "lade", "lady", "laid", "lain", "lair", "lake", "lama", "lamb", "lame", "lamp", "land", "lane", "lank", "lard", "lark", "lash", "lass", "last", "late", "lath", "laud", "lava", "lave", "lawn", "laze", "lazy", "lead", "leaf", "leak", "lean", "leap", "leek", "leer", "left", "lend", "lens", "lent", "less", "lest", "levy", "lewd", "liar", "lick", "lied", "lien", "lier", "lieu", "life", "lift", "like", "lilt", "lily", "limb", "lime", "limo", "limp", "limy", "line", "link", "lint", "lion", "lira", "lisp", "list", "lite", "live", "load", "loaf", "loam", "loan", "lobe", "lock", "loco", "lode", "loft", "logo", "logy", "loin", "loll", "lone", "long", "look", "loom", "loon", "loop", "loot", "lope", "lord", "lore", "lorn", "lose", "loss", "lost", "loth", "loud", "lout", "love", "lows", "luck", "lucy", "luge", "lull", "lulu", "lump", "luna", "lung", "lure", "lurk", "lush", "lust", "lute", "luxe", "lynx", "lyre", "mace", "mach", "mack", "made", "mage", "magi", "maid", "mail", "maim", "main", "make", "male", "mall", "malt", "mama", "mane", "many", "mare", "mark", "mart", "mash", "mask", "mass", "mast", "mate", "math", "maul", "maws", "mayo", "maze", "mead", "meal", "mean", "meat", "meek", "meet", "meld", "melt", "memo", "mend", "menu", "meow", "mere", "mesa", "mesh", "mess", "mete", "mewl", "mica", "mice", "mien", "mike", "mild", "mile", "milk", "mill", "milt", "mime", "mind", "mine", "mini", "mink", "mint", "minx", "mire", "miry", "miso", "miss", "mist", "mite", "mitt", "moan", "moat", "mock", "mode", "moil", "mold", "mole", "molt", "moms", "monk", "mono", "mood", "moot", "mope", "more", "morn", "moss", "most", "mote", "moth", "move", "mown", "much", "muck", "muff", "mule", "mull", "mums", "murk", "muse", "mush", "musk", "muss", "must", "mute", "mutt", "myna", "myth", "naif", "nail", "name", "nape", "narc", "nard", "nark", "nave", "navy", "near", "neat", "neck", "need", "nerd", "nest", "newt", "next", "nice", "nick", "nigh", "nile", "nips", "nix", "node", "noel", "none", "nook", "noon", "norm", "nose", "nosh", "nosy", "note", "noun", "nova", "nude", "nuke", "null", "numb", "nuts", "oath", "oats", "obey", "oboe", "ogle", "ogre", "oils", "oily", "oink", "okay", "okra", "olds", "oleo", "omen", "omit", "once", "only", "onto", "onus", "onyx", "ooze", "oozy", "opal", "open", "opts", "opus", "oral", "orbs", "orgy", "ouch", "oust", "ouzo", "oval", "oven", "over", "ovum", "owes", "owls", "owns", "oxen", "pace", "pack", "pact", "page", "paid", "pail", "pain", "pair", "pale", "pall", "palm", "pane", "pang", "pant", "papa", "para", "pard", "pare", "park", "part", "past", "pate", "path", "pave", "pawl", "pawn", "paws", "peak", "peal", "pear", "peas", "peat", "peck", "peed", "peek", "peel", "peep", "peer", "pelf", "pelt", "pend", "pent", "peon", "perk", "perm", "pert", "peso", "pest", "pets", "pews", "pica", "pick", "pics", "pied", "pier", "pigs", "pike", "pile", "pill", "pimp", "pine", "ping", "pink", "pint", "piny", "pipe", "pips", "piss", "pita", "pith", "pity", "pixy", "plan", "plat", "play", "plea", "pleb", "pled", "plod", "plop", "plot", "plow", "ploy", "plug", "plum", "plus", "pock", "poem", "poet", "pogo", "poke", "poky", "pole", "poll", "polo", "pomp", "pond", "pone", "pong", "pony", "pooh", "pool", "poop", "poor", "pope", "pore", "pork", "porn", "port", "pose", "posh", "post", "posy", "pouf", "pour", "pout", "pram", "prat", "pray", "prep", "prey", "prig", "prim", "pro", "prod", "prof", "prom", "prop", "prow", "puck", "puff", "puke", "pule", "pull", "pulp", "puma", "pump", "punk", "punt", "puny", "pupa", "pure", "purl", "purr", "push", "puss", "putt", "pyre", "quad", "quay", "quid", "quin", "quip", "quit", "quiz", "race", "rack", "racy", "raft", "raga", "rage", "raid", "rail", "rain", "rake", "ramp", "rand", "rang", "rank", "rant", "rapt", "rare", "rash", "rasp", "rate", "rave", "raws", "raze", "read", "real", "ream", "reap", "rear", "reck", "reed", "reef", "reek", "reel", "rein", "rely", "rend", "rent", "rest", "revs", "rhyme", "rice", "rich", "rick", "ride", "rife", "riff", "rift", "rile", "rill", "rime", "rind", "ring", "rink", "rinse", "riot", "ripe", "rise", "risk", "rite", "ritz", "road", "roam", "roan", "roar", "robe", "rock", "rode", "roil", "role", "roll", "romp", "rood", "roof", "rook", "room", "root", "rope", "ropy", "rosa", "rose", "rosy", "rote", "rout", "roux", "rove", "rube", "ruby", "rude", "rued", "ruff", "ruin", "rule", "rump", "rune", "rung", "runt", "ruse", "rush", "rusk", "rust", "ruts", "sack", "safe", "saga", "sage", "sago", "said", "sail", "sake", "saki", "sale", "salt", "same", "sand", "sane", "sang", "sank", "saps", "sari", "sash", "sate", "save", "sawn", "says", "scab", "scad", "scam", "scan", "scar", "scat", "scow", "scud", "scum", "seal", "seam", "sear", "seas", "seat", "sect", "seed", "seek", "seem", "seen", "seep", "seer", "sees", "self", "sell", "send", "sent", "serb", "sere", "serf", "sets", "sewn", "sews", "sexy", "shad", "shag", "shah", "sham", "shay", "shed", "shim", "shin", "ship", "shod", "shoe", "shoo", "shop", "shot", "show", "shun", "shut", "siam", "sick", "side", "sift", "sigh", "sign", "sikh", "silk", "sill", "silo", "silt", "sine", "sing", "sink", "sips", "sire", "site", "size", "skew", "skid", "skim", "skin", "skip", "skis", "skit", "slab", "slag", "slam", "slap", "slat", "slay", "sled", "slew", "slid", "slim", "slip", "slit", "slob", "sloe", "slog", "slop", "slot", "slow", "slue", "slug", "slum", "slur", "smog", "smug", "smut", "snag", "snap", "snip", "snit", "snob", "snot", "snow", "snub", "snug", "soak", "soap", "soar", "sock", "soda", "sofa", "soft", "soil", "sold", "sole", "solo", "some", "song", "soon", "soot", "sops", "sore", "sort", "soul", "soup", "sour", "sown", "soya", "spam", "span", "spar", "spas", "spat", "spay", "spec", "sped", "spew", "spin", "spit", "spot", "spry", "spud", "spun", "spur", "stab", "stag", "star", "stat", "stay", "stem", "step", "stew", "stir", "stoa", "stop", "stow", "stub", "stud", "stun", "stye", "styx", "subs", "such", "suck", "suds", "sued", "suet", "suit", "sulk", "sumo", "sump", "sung", "sunk", "sups", "sure", "surf", "suss", "swab", "swag", "swam", "swan", "swap", "swat", "sway", "swig", "swim", "swum", "sync", "tabu", "tack", "taco", "tact", "tags", "tail", "take", "tale", "talk", "tall", "tame", "tamp", "tang", "tank", "tape", "taps", "tare", "tarn", "taro", "tarp", "tart", "task", "tate", "taut", "taxi", "teak", "teal", "team", "tear", "teat", "teed", "teem", "teen", "tell", "tend", "tent", "term", "tern", "test", "text", "than", "that", "thaw", "thee", "them", "then", "they", "thin", "this", "thou", "thud", "thug", "thus", "tick", "tide", "tidy", "tied", "tier", "tiff", "tile", "till", "tilt", "time", "tine", "tins", "tint", "tiny", "tipi", "tips", "tire", "toad", "toed", "toga", "togs", "toil", "toke", "told", "toll", "tomb", "tome", "tone", "tong", "tony", "took", "tool", "toot", "tops", "tore", "torn", "tort", "tory", "toss", "tote", "tour", "tout", "town", "tows", "toys", "trace", "track", "trade", "tram", "trap", "tray", "tree", "trek", "trig", "trim", "trio", "trip", "trod", "trot", "troy", "true", "trug", "tsar", "tuba", "tube", "tuck", "tuff", "tuft", "tugs", "tuna", "tune", "tuns", "turd", "turf", "turn", "tush", "tusk", "tutu", "twas", "twig", "twin", "twit", "twos", "tyke", "type", "typo", "tyro", "ugly", "ulna", "undo", "unit", "unite", "unto", "upon", "urea", "urge", "uric", "urns", "user", "uses", "ussr", "utah", "vail", "vain", "vale", "valet", "vamp", "vane", "vary", "vase", "vast", "vats", "veal", "veep", "veer", "veil", "vein", "veld", "vend", "vent", "verb", "very", "vest", "veto", "vets", "vial", "vibe", "vice", "vied", "view", "vile", "vine", "vino", "viny", "viol", "visa", "vise", "vita", "void", "vole", "volt", "vote", "vows", "wack", "wade", "waft", "wage", "wags", "waif", "wail", "wait", "wake", "wale", "walk", "wall", "wand", "wane", "wang", "want", "ward", "ware", "warm", "warn", "warp", "wars", "wart", "wary", "wash", "wasp", "wast", "watt", "wave", "wavy", "waxy", "ways", "weak", "weal", "wean", "wear", "webs", "weds", "weed", "week", "ween", "weep", "weft", "weir", "weld", "well", "welt", "wend", "went", "wept", "were", "west", "wets", "wham", "what", "when", "whet", "whew", "whey", "whig", "whim", "whip", "whit", "whiz", "whoa", "whom", "whop", "whys", "wick", "wide", "wife", "wigs", "wild", "wile", "will", "wilt", "wily", "wimp", "wind", "wine", "wing", "wink", "wino", "wins", "winy", "wipe", "wire", "wiry", "wise", "wish", "wisp", "wist", "with", "wits", "wive", "woes", "woke", "wolf", "womb", "wont", "wood", "woof", "wool", "woos", "word", "wore", "work", "worm", "worn", "wove", "wows", "wrap", "wren", "writ", "wyes", "yacht", "yaks", "yale", "yams", "yang", "yank", "yaps", "yard", "yarn", "yawl", "yawn", "yaws", "yeah", "year", "yell", "yelp", "yens", "yeti", "yews", "yips", "yoga", "yogi", "yoke", "yolk", "yore", "your", "yowl", "yule", "yuks", "yummy", "yuppy", "zags", "zany", "zaps", "zeal", "zebu", "zeds", "zees", "zero", "zest", 'awake', 'award', 'baker', 'basic', 'beach', 'beard', 'beast', 'begin', 'being', 'below', 'bench', 'bible', 'birth', 'black', 'blade', 'blame', 'blank', 'blast', 'blaze', 'bleed', 'blend', 'bless', 'blind', 'blink', 'block', 'blood', 'bloom', 'board', 'boast', 'boost', 'booth', 'bored', 'brain', 'brake', 'brand', 'brave', 'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'brisk', 'broad', 'broke', 'brown', 'brush', 'build', 'bunch', 'burst', 'cable', 'camel', 'canal', 'candy', 'carry', 'catch', 'cause', 'cease', 'chain', 'chair', 'chalk', 'charm', 'chart', 'chase', 'cheap', 'check', 'cheek', 'cheer', 'chess', 'chest', 'chick', 'chief', 'child', 'chili', 'chill', 'choir', 'choke', 'chord', 'chose', 'civil', 'claim', 'clamp', 'clash', 'class', 'clean', 'clear', 'clerk', 'click', 'cliff', 'climb', 'clock', 'close', 'cloth', 'cloud', 'clown', 'coach', 'coast', 'cobra', 'colon', 'color', 'comet', 'comic', 'coral', 'couch', 'cough', 'could', 'count', 'court', 'cover', 'crack', 'craft', 'crane', 'crank', 'crash', 'crawl', 'crazy', 'cream', 'credit', 'creep', 'crime', 'crisp', 'cross', 'crowd', 'crown', 'crush', 'crust', 'cubic', 'curse', 'curve', 'cycle', 'daily', 'dance', 'daisy', 'death', 'debug', 'decay', 'delay', 'delta', 'demon', 'depth', 'deter', 'devil', 'diary', 'diner', 'dirty', 'ditch', 'dizzy', 'dodge', 'donut', 'doubt', 'dozen', 'draft', 'drain', 'drama', 'drank', 'dream', 'dress', 'drill', 'drink', 'drive', 'drove', 'drown', 'dryer', 'dusty', 'dutch', 'dwarf', 'eager', 'eagle', 'early', 'earth', 'eight', 'elbow', 'elder', 'elect', 'elite', 'empty', 'enemy', 'enjoy', 'enter', 'equal', 'error', 'essay', 'ethic', 'event', 'every', 'exact', 'excel', 'exist', 'extra', 'fable', 'faint', 'fairy', 'faith', 'false', 'fancy', 'fatal', 'fault', 'favor', 'feast', 'fence', 'ferry', 'fetch', 'fever', 'fiber', 'field', 'fiery', 'fifth', 'fifty', 'fight', 'final', 'first', 'flame', 'flash', 'fleet', 'flesh', 'float', 'flock', 'flood', 'floor', 'flour', 'fluid', 'flush', 'focus', 'force', 'forge', 'forth', 'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front', 'frost', 'fruit', 'fudge', 'funny', 'fuzzy', 'gamma', 'gauge', 'gecko', 'ghost', 'giant', 'gifted', 'given', 'glass', 'globe', 'glory', 'glove', 'grace', 'grade', 'grain', 'grand', 'grant', 'grape', 'graph', 'grasp', 'grass', 'grave', 'gravy', 'great', 'greed', 'green', 'greet', 'grill', 'grind', 'gripe', 'gross', 'group', 'grove', 'grown', 'guard', 'guess', 'guest', 'guide', 'guilt', 'habit', 'hairy', 'handy', 'happy', 'hardy', 'harsh', 'haste', 'hatch', 'haunt', 'haven', 'hazel', 'heart', 'heath', 'heavy', 'hedge', 'hefty', 'hello', 'hence', 'henna', 'hilly', 'hinge', 'hippo', 'hobby', 'hocus', 'hoist', 'hollow', 'honor', 'horde', 'horse', 'hotel', 'hound', 'house', 'hover', 'human', 'humid', 'humor', 'hurry', 'hydro', 'ideal', 'idiot', 'image', 'imply', 'index', 'inner', 'input', 'irony', 'issue', 'ivory', 'jelly', 'jiffy', 'joint', 'joker', 'jolly', 'judge', 'juice', 'juicy', 'jumbo', 'jumpy', 'jungle', 'junior', 'juror', 'kayak', 'kebab', 'kinky', 'kiosk', 'kitty', 'knack', 'knife', 'knock', 'koala', 'label', 'labor', 'laden', 'lager', 'lance', 'large', 'laser', 'latch', 'later', 'laugh', 'layer', 'lease', 'least', 'leave', 'legal', 'lemon', 'level', 'lever', 'light', 'lilac', 'limit', 'linen', 'liner', 'lingo', 'liver', 'local', 'locus', 'lodge', 'logic', 'login', 'loose', 'lorry', 'loser', 'lotto', 'lounge', 'lover', 'lower', 'loyal', 'lucid', 'lucky', 'lunar', 'lunch', 'lurid', 'lying', 'lyric', 'macro', 'magic', 'major', 'maker', 'mango', 'manic', 'manor', 'maple', 'march', 'marry', 'marsh', 'match', 'maxim', 'maybe', 'mayor', 'medal', 'media', 'melee', 'melon', 'mercy', 'merge', 'merit', 'merry', 'metal', 'meter', 'metro', 'micro', 'midst', 'might', 'mimic', 'mince', 'minor', 'minus', 'miser', 'mocha', 'modal', 'model', 'moist', 'molar', 'money', 'month', 'moral', 'morph', 'motel', 'motor', 'motto', 'mound', 'mouse', 'mouth', 'movie', 'mower', 'mucky', 'muddy', 'mural', 'music', 'musty', 'nacho', 'naive', 'naked', 'nanny', 'nasal', 'nasty', 'naval', 'nerve', 'never', 'newer', 'newly', 'nexus', 'niche', 'niece', 'night', 'ninja', 'ninth', 'noble', 'noise', 'noisy', 'north', 'notch', 'novel', 'nurse', 'nylon', 'oasis', 'occur', 'ocean', 'octet', 'offer', 'often', 'older', 'olive', 'omega', 'onion', 'onset', 'opera', 'optic', 'orbit', 'order', 'organ', 'other', 'otter', 'ought', 'ounce', 'outer', 'overt', 'owner', 'ozone', 'pagan', 'paint', 'panel', 'panic', 'pants', 'paper', 'parch', 'pardon', 'parent', 'parka', 'parse', 'party', 'pasta', 'paste', 'patch', 'patio', 'pause', 'pave', 'peace', 'peach', 'pearl', 'pecan', 'pedal', 'penal', 'penny', 'perch', 'peril', 'pesto', 'petal', 'phase', 'phone', 'phony', 'photo', 'piano', 'picky', 'piece', 'pigeon', 'pilot', 'pinch', 'pious', 'piper', 'pique', 'pitch', 'pivot', 'pixel', 'pizza', 'place', 'plaid', 'plain', 'plank', 'plant', 'plate', 'plaza', 'pleat', 'plumb', 'plush', 'podium', 'point', 'poker', 'polar', 'polka', 'poppy', 'porch', 'poser', 'pouch', 'pound', 'power', 'prank', 'prawn', 'preach', 'press', 'price', 'pride', 'prime', 'primp', 'print', 'prior', 'prism', 'prize', 'probe', 'prone', 'prong', 'proof', 'prose', 'proud', 'prove', 'prowl', 'proxy', 'prune', 'psalm', 'psych', 'puffy', 'pulse', 'punch', 'puppy', 'purge', 'purse', 'pushy', 'quack', 'quail', 'quake', 'qualm', 'quark', 'quart', 'quash', 'quasi', 'queen', 'queer', 'quell', 'query', 'quest', 'quick', 'quiet', 'quill', 'quilt', 'quint', 'quirk', 'quite', 'quota', 'quote', 'rabbi', 'rabid', 'radar', 'radio', 'rainy', 'raise', 'rally', 'ranch', 'random', 'range', 'rapid', 'ratio', 'raven', 'razor', 'reach', 'react', 'ready', 'realm', 'rebel', 'recap', 'recur', 'regal', 'reign', 'relax', 'relay', 'relic', 'remit', 'renal', 'renew', 'repay', 'repel', 'reply', 'rerun', 'reset', 'resin', 'retch', 'retro', 'retry', 'reuse', 'rhino', 'rhyme', 'ridge', 'rifle', 'right', 'rigid', 'rigor', 'rinse', 'ripen', 'risen', 'riser', 'risky', 'rival', 'river', 'roach', 'roast', 'robin', 'robot', 'rocky', 'rogue', 'roman', 'rodeo', 'roomy', 'roost', 'rotor', 'rouge', 'rough', 'round', 'rouse', 'route', 'rover', 'royal', 'ruddy', 'ruler', 'rumor', 'runny', 'rural', 'rusty', 'sadly', 'safer', 'salad', 'salon', 'salsa', 'salty', 'salve', 'sandy', 'satin', 'satyr', 'sauce', 'saucy', 'sauna', 'saute', 'savor', 'savoy', 'savvy', 'scale', 'scalp', 'scaly', 'scamp', 'scant', 'scare', 'scarf', 'scary', 'scene', 'scent', 'schwa', 'scoff', 'scold', 'scone', 'scoop', 'scope', 'score', 'scorn', 'scour', 'scout', 'scowl', 'scram', 'scrap', 'scree', 'screw', 'scrub', 'scrum', 'scuba', 'scuff', 'scull', 'seedy', 'segue', 'seize', 'sense', 'serum', 'serve', 'setup', 'seven', 'sever', 'sewer', 'shack', 'shade', 'shady', 'shaft', 'shake', 'shaky', 'shale', 'shall', 'shame', 'shank', 'shape', 'share', 'shark', 'sharp', 'shave', 'shawl', 'shear', 'sheen', 'sheep', 'sheer', 'sheet', 'sheik', 'shelf', 'shell', 'shift', 'shine', 'shiny', 'shire', 'shirk', 'shirt', 'shiver', 'shock', 'shone', 'shook', 'shoot', 'shore', 'shorn', 'short', 'shout', 'shove', 'shown', 'showy', 'shred', 'shrew', 'shrub', 'shrug', 'shuck', 'shunt', 'shush', 'shyly', 'siege', 'sieve', 'sight', 'sigma', 'silky', 'silly', 'since', 'sinew', 'singe', 'siren', 'sixth', 'sixty', 'skate', 'skier', 'skiff', 'skill', 'skimp', 'skirt', 'skulk', 'skull', 'skunk', 'slack', 'slain', 'slang', 'slant', 'slash', 'slate', 'slave', 'sleek', 'sleep', 'sleet', 'slept', 'slice', 'slick', 'slide', 'slime', 'slimy', 'sling', 'slink', 'slope', 'slosh', 'sloth', 'slump', 'slung', 'slurp', 'slush', 'slyly', 'smack', 'small', 'smart', 'smash', 'smear', 'smell', 'smelt', 'smile', 'smirk', 'smite', 'smith', 'smock', 'smoke', 'smoky', 'smote', 'snack', 'snail', 'snake', 'snaky', 'snare', 'snarl', 'sneak', 'sneer', 'snide', 'sniff', 'snipe', 'snoop', 'snore', 'snort', 'snout', 'snowy', 'snuck', 'snuff', 'soapy', 'sober', 'soggy', 'solar', 'solid', 'solve', 'sonar', 'sonic', 'sooth', 'sooty', 'sorry', 'sound', 'south', 'sower', 'space', 'spade', 'spank', 'spare', 'spark', 'spasm', 'spawn', 'speak', 'spear', 'speck', 'speed', 'spell', 'spelt', 'spend', 'spent', 'sperm', 'spice', 'spicy', 'spied', 'spiel', 'spike', 'spiky', 'spill', 'spilt', 'spine', 'spiny', 'spire', 'spite', 'splat', 'split', 'spoil', 'spoke', 'spoof', 'spook', 'spool', 'spoon', 'spore', 'sport', 'spout', 'spray', 'spree', 'sprig', 'spunk', 'spurn', 'spurt', 'squad', 'squat', 'squid', 'stack', 'staff', 'stage', 'stain', 'stair', 'stake', 'stale', 'stalk', 'stall', 'stamp', 'stand', 'stank', 'stare', 'stark', 'start', 'stash', 'state', 'stave', 'stead', 'steak', 'steal', 'steam', 'steed', 'steel', 'steep', 'steer', 'stein', 'stern', 'stick', 'stiff', 'still', 'stilt', 'sting', 'stink', 'stint', 'stock', 'stoic', 'stoke', 'stole', 'stomp', 'stone', 'stony', 'stood', 'stool', 'stoop', 'store', 'stork', 'storm', 'story', 'stout', 'stove', 'strap', 'straw', 'stray', 'strep', 'strew', 'strip', 'strop', 'strum', 'strut', 'stuck', 'study', 'stuff', 'stump', 'stung', 'stunk', 'stunt', 'style', 'suave', 'sugar', 'suing', 'suite', 'sulky', 'sushi', 'swami', 'swamp', 'swarm', 'swash', 'swath', 'swear', 'sweat', 'sweep', 'sweet', 'swell', 'swept', 'swift', 'swill', 'swine', 'swing', 'swirl', 'swish', 'swoon', 'swoop', 'sword', 'swore', 'sworn', 'swung', 'synod', 'syrup', 'table', 'tacky', 'taffy', 'taken', 'taker', 'tally', 'talon', 'tamer', 'tango', 'tangy', 'taper', 'tapir', 'tardy', 'tarot', 'taste', 'tasty', 'tatty', 'taunt', 'tawny', 'teach', 'tearful', 'tease', 'teddy', 'teeth', 'tempo', 'tench', 'tenor', 'tense', 'tenth', 'tepee', 'tepid', 'terror', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'theta', 'thick', 'thief', 'thigh', 'thing', 'think', 'third', 'thong', 'thorn', 'those', 'three', 'threw', 'throb', 'throw', 'thrum', 'thumb', 'thump', 'thyme', 'tiara', 'tibia', 'tidal', 'tiger', 'tight', 'tilde', 'timer', 'timid', 'tinge', 'tippy', 'tipsy', 'titan', 'tithi', 'title', 'toast', 'today', 'toddy', 'token', 'tonal', 'tonga', 'tonic', 'tooth', 'topaz', 'topic', 'torch', 'torso', 'torus', 'total', 'touch', 'tough', 'towel', 'tower', 'toxic', 'toxin', 'trace', 'track', 'tract', 'trade', 'trail', 'train', 'trait', 'tramp', 'trash', 'trawl', 'tread', 'treat', 'trend', 'triad', 'trial', 'tribe', 'trice', 'trick', 'tried', 'tripe', 'trite', 'troll', 'troop', 'trope', 'trout', 'trove', 'truce', 'truck', 'truer', 'truly', 'trump', 'trunk', 'truss', 'trust', 'truth', 'tryst', 'tubal', 'tuber', 'tulip', 'tulle', 'tumor', 'tunic', 'turbo', 'tutor', 'twang', 'tweak', 'tweed', 'tweet', 'twice', 'twine', 'twirl', 'twist', 'twixt', 'tying', 'udder', 'ulcer', 'ultra', 'umbra', 'uncle', 'uncut', 'under', 'undid', 'undue', 'unfed', 'unfit', 'unify', 'union', 'unite', 'unity', 'unlit', 'unmet', 'unpin', 'unred', 'unsee', 'unset', 'untie', 'until', 'unwed', 'unzip', 'upper', 'upset', 'urban', 'urine', 'usage', 'usher', 'usual', 'usurp', 'utile', 'utter', 'vague', 'valet', 'valid', 'valor', 'value', 'valve', 'vampy', 'vanish', 'vapor', 'vegan', 'venom', 'venue', 'verge', 'verse', 'verso', 'verve', 'vexed', 'vicar', 'video', 'vigil', 'vigor', 'villa', 'vinyl', 'viola', 'viper', 'viral', 'virus', 'visit', 'visor', 'vista', 'vital', 'vivid', 'vixen', 'vocal', 'vodka', 'vogue', 'voice', 'vomit', 'voter', 'vouch', 'vowel', 'vying', 'wacky', 'wafer', 'wager', 'wagon', 'waist', 'waive', 'waltz', 'warty', 'waste', 'watch', 'water', 'waver', 'waxen', 'weary', 'weave', 'wedge', 'weedy', 'weigh', 'weird', 'welch', 'welsh', 'wench', 'whack', 'whale', 'wharf', 'wheat', 'wheel', 'whelp', 'where', 'which', 'whiff', 'while', 'whine', 'whiny', 'whip', 'whirl', 'whisk', 'white', 'whole', 'whoop', 'whorl', 'whose', 'widen', 'wider', 'widow', 'width', 'wield', 'wight', 'willy', 'wimpy', 'wince', 'winch', 'windy', 'wiser', 'wispy', 'witch', 'witty', 'woken', 'woman', 'womb', 'wooer', 'wooly', 'woozy', 'wordy', 'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'woven', 'wowed', 'wrack', 'wrath', 'wreak', 'wreck', 'wrest', 'wring', 'wrist', 'write', 'wrong', 'wrote', 'wrung', 'wryly', 'yacht', 'yearn', 'yeast', 'yield', 'yodel', 'yokel', 'young', 'yummy', 'zebra', 'zesty', 'zippy'];

const HARD_WORDS = ["abacus", "abbey", "abdomen", "ability", "abolish", "abroad", "absence", "absorb", "absurd", "academy", "accent", "accept", "access", "accord", "accuse", "achieve", "acidic", "acquire", "acrobat", "action", "active", "actor", "actress", "actual", "adapt", "addict", "address", "adjust", "admire", "admit", "adobe", "adopt", "advance", "advice", "advise", "affair", "affect", "affirm", "afford", "afraid", "agency", "agenda", "agent", "agile", "agony", "agree", "ahead", "aisle", "alarm", "album", "alert", "algebra", "alien", "align", "alike", "alive", "allege", "alley", "allow", "alloy", "almost", "alone", "along", "aloud", "alpha", "already", "also", "altar", "alter", "always", "amateur", "amazing", "amber", "ambush", "amend", "amount", "amuse", "analog", "analyze", "anchor", "ancient", "angel", "anger", "angle", "angry", "animal", "ankle", "annex", "annual", "answer", "antenna", "anxiety", "anybody", "anyhow", "anymore", "anyone", "anyway", "apart", "apathy", "apology", "appear", "apple", "apply", "appoint", "approve", "apron", "arcade", "archer", "arena", "argue", "arise", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "article", "artist", "ashamed", "aside", "askew", "aspect", "assault", "asset", "assign", "assist", "assume", "assure", "asthma", "athlete", "atlas", "atom", "attach", "attack", "attend", "attic", "attract", "auction", "audio", "audit", "august", "aunt", "author", "auto", "autumn", "avenue", "average", "avoid", "await", "awake", "award", "aware", "awful", "awkward", "axis", "bachelor", "bacon", "badge", "badly", "baggage", "baggy", "bail", "bait", "bake", "balance", "balcony", "bald", "ballet", "balloon", "bamboo", "banana", "bandage", "banish", "banker", "banner", "banquet", "baptism", "barber", "barely", "bargain", "barrel", "barrier", "base", "basic", "basin", "basis", "basket", "battle", "beach", "beacon", "beak", "beam", "bean", "bear", "beard", "beast", "beauty", "become", "bedbug", "before", "beggar", "behave", "behind", "believe", "bellow", "belong", "below", "benefit", "bestow", "betray", "better", "beware", "beyond", "bicycle", "bidder", "bifocal", "bigger", "billion", "bind", "biology", "bird", "birth", "biscuit", "bishop", "bite", "bitter", "bizarre", "black", "blade", "blame", "blanket", "blast", "blaze", "bleak", "bleach", "bleed", "blend", "bless", "blind", "blink", "blizzard", "block", "blood", "bloom", "blouse", "blue", "bluff", "blush", "board", "boast", "boat", "body", "boil", "bold", "bomb", "bond", "bone", "bonus", "book", "booming", "boost", "booth", "border", "boring", "borrow", "boss", "bottom", "bounce", "bound", "bowel", "bowl", "boxer", "boycott", "brain", "brake", "branch", "brand", "brass", "brave", "bread", "break", "breast", "breathe", "breed", "breeze", "bribe", "brick", "bride", "bridge", "brief", "bright", "brilliant", "bring", "brisk", "broad", "broccoli", "broken", "bronze", "brook", "broom", "brother", "brown", "bruise", "brush", "bubble", "bucket", "budget", "buggy", "build", "bulb", "bulge", "bulk", "bullet", "bumper", "bundle", "bunker", "burden", "burger", "burial", "burly", "burn", "burst", "bury", "bushel", "business", "busy", "butter", "button", "buy", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "cancer", "candid", "candle", "candy", "cane", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "catch", "category", "cater", "cattle", "cause", "caution", "cave", "cease", "ceiling", "celebrate", "cell", "cellar", "cement", "censor", "center", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "cheat", "check", "cheek", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chili", "chill", "chimney", "chip", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "circus", "citizen", "city", "civil", "claim", "clap", "clarify", "clash", "class", "classic", "clean", "clear", "clever", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clue", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "cold", "collar", "collect", "color", "column", "combine", "come", "comedy", "comfort", "comic", "command", "comment", "commit", "common", "company", "compare", "compete", "complex", "computer", "concept", "concern", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cookie", "cool", "copper", "copy", "coral", "core", "corn", "corner", "correct", "cost", "costume", "cottage", "couch", "cough", "council", "counsel", "count", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crow", "crowd", "crucial", "cruel", "cruise", "crumble", "crush", "cry", "crystal", "cube", "culture", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "cynic", "dad", "damage", "damp", "dance", "danger", "daring", "dark", "dash", "date", "daughter", "dawn", "day", "dead", "deal", "debate", "debris", "decade", "decay", "decent", "decide", "decline", "decorate", "decrease", "deed", "deep", "deer", "defeat", "defend", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "despise", "destroy", "detail", "detect", "develop", "device", "devote", "diagnose", "diamond", "diary", "dice", "diet", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "ego", "eight", "either", "elbow", "elder", "elect", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "flood", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "foreign", "forest", "forgive", "fork", "form", "formal", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "function", "fund", "funeral", "funny", "fur", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glass", "glaze", "gleam", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goal", "goat", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "habitat", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jumbo", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "league", "learn", "lease", "leather", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memorial", "memory", "mention", "menu", "mercy", "merge", "merit", "mesh", "message", "metal", "method", "middle", "midnight", "might", "milk", "mimic", "mind", "minimal", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "money", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "mystery", "myth", "naive", "name", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "officer", "official", "often", "oil", "ok", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pain", "paint", "pair", "palace", "palm", "panel", "panic", "panther", "paper", "parade", "parent", "park", "part", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "plenty", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "policy", "political", "pond", "pony", "pool", "popular", "portion", "position", "positive", "possible", "post", "pot", "potato", "pouch", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "prior", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "purchase", "pure", "purple", "purpose", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "rip", "ripe", "rise", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salary", "sale", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scold", "scope", "score", "scorn", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sculpture", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "shelter", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "signal", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "sit", "situation", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smog", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spark", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "user", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "weapon", "weary", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

const shuffleList = <T,>(list: T[]): T[] => {
    const newList = [...list];
    for (let i = newList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newList[i], newList[j]] = [newList[j], newList[i]];
    }
    return newList;
};

const DIFFICULTY_SETTINGS = {
  easy: { speed: 0.8, spawnRate: 2200, items: "abcdefghijklmnopqrstuvwxyz".split(''), scoreThresholds: { oneStar: 20, twoStar: 40, threeStar: 60 } },
  medium: { speed: 1.2, spawnRate: 1800, items: MEDIUM_WORDS, scoreThresholds: { oneStar: 30, twoStar: 60, threeStar: 90 } },
  hard: { speed: 1.6, spawnRate: 1200, items: HARD_WORDS, scoreThresholds: { oneStar: 50, twoStar: 100, threeStar: 150 } },
};

const BUBBLE_COLORS = [
    "bg-blue-400 border-blue-200/50",
    "bg-green-400 border-green-200/50",
    "bg-purple-400 border-purple-200/50",
    "bg-pink-400 border-pink-200/50",
    "bg-orange-400 border-orange-200/50",
    "bg-teal-400 border-teal-200/50",
];

const INITIAL_LIVES = 5;
const GAME_DURATION_S = 60;

export default function TypingRushGame({ onBack, difficulty }: TypingRushGameProps) {
    const [gameState, setGameState] = useState<"playing" | "paused" | "gameOver" | "win">("playing");
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(INITIAL_LIVES);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
    const [fallingObjects, setFallingObjects] = useState<FallingObject[]>([]);
    const [keyBuffer, setKeyBuffer] = useState("");
    const [gameAreaHeight, setGameAreaHeight] = useState(500);

    const [isCalculatingReward, setIsCalculatingReward] = useState(false);
    const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

    const gameLoopRef = useRef<number | null>(null);
    const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const sessionWordList = useRef<string[]>([]);
    const { toast } = useToast();
    
    useEffect(() => {
        if (gameAreaRef.current) {
            setGameAreaHeight(gameAreaRef.current.offsetHeight);
        }
    }, []);
    
    const StarRating = ({ rating }: { rating: number }) => (
        <div className="flex justify-center">
            {[...Array(3)].map((_, i) => (
                <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
            ))}
        </div>
    );
    
    const calculateStars = useCallback((score: number): number => {
        const { oneStar, twoStar, threeStar } = DIFFICULTY_SETTINGS[difficulty].scoreThresholds;
        if (score >= threeStar) return 3;
        if (score >= twoStar) return 2;
        if (score >= oneStar) return 1;
        return 0;
    }, [difficulty]);
    
    const handleWin = useCallback(async () => {
        setGameState("win");
        setIsCalculatingReward(true);
        updateGameStats({ gameId: 'typingRush', didWin: true, score });
        
        try {
            const rewards = await calculateRewards({ gameId: 'typingRush', difficulty, performanceMetrics: { score }});
            const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Won Typing Rush (${difficulty})`);
            const stars = calculateStars(score);
            setLastReward({ points: earned.points, coins: earned.coins, stars });
        } catch(e) {
            console.error("Error calculating rewards:", e);
            toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
        } finally {
            setIsCalculatingReward(false);
        }
    }, [difficulty, score, toast, calculateStars]);

    const spawnObject = useCallback(() => {
        if (sessionWordList.current.length === 0) {
            const settings = DIFFICULTY_SETTINGS[difficulty];
            sessionWordList.current = shuffleList([...settings.items]);
        }

        const text = sessionWordList.current.pop() || DIFFICULTY_SETTINGS[difficulty].items[0];
        const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
        const newObject: FallingObject = {
            id: Date.now() + Math.random(),
            text,
            x: Math.random() * 90 + 5,
            y: -30,
            speed: DIFFICULTY_SETTINGS[difficulty].speed + Math.random() * 0.4,
            status: 'falling',
            color: color,
        };
        setFallingObjects(prev => [...prev, newObject]);
    }, [difficulty]);

    const gameLoop = useCallback(() => {
        setFallingObjects(prev => {
            const updatedObjects = prev.map(obj => ({ ...obj, y: obj.y + obj.speed }));
            const missedObjects = updatedObjects.filter(obj => obj.y > gameAreaHeight && obj.status === 'falling');

            if (missedObjects.length > 0) {
                setTimeout(() => {
                    setLives(l => Math.max(0, l - missedObjects.length));
                    missedObjects.forEach(obj => {
                        toast({ variant: 'destructive', title: 'Miss!', description: `You missed "${obj.text}"`, duration: 2000 });
                    });
                }, 0);
            }
            
            return updatedObjects.filter(obj => obj.y <= gameAreaHeight || obj.status !== 'falling');
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [toast, gameAreaHeight]);

    const pauseGame = () => {
        if (gameState === "playing") setGameState("paused");
    };

    const resumeGame = () => {
        if (gameState === "paused") {
            setGameState("playing");
        }
    };
    
    const restartGame = useCallback(() => {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        sessionWordList.current = shuffleList([...settings.items]);
        setScore(0);
        setLives(INITIAL_LIVES);
        setFallingObjects([]);
        setGameState("playing");
        setTimeLeft(GAME_DURATION_S);
        setLastReward(null);
        setKeyBuffer("");
    }, [difficulty]);

    useEffect(() => {
        if (lives <= 0 && gameState === 'playing') {
            setGameState("gameOver");
            updateGameStats({ gameId: 'typingRush', didWin: false, score });
        }
    }, [lives, gameState, score]);
    
    useEffect(() => {
        if (timeLeft <= 0 && gameState === 'playing') {
            handleWin();
        }
    }, [timeLeft, gameState, handleWin]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameState !== 'playing' || !event.key.match(/^[a-zA-Z]$/)) return;

            const newBuffer = (keyBuffer + event.key).toLowerCase();
            setKeyBuffer(newBuffer);

            setFallingObjects(currentObjects => {
                const matchedObject = currentObjects.find(
                    (obj) => obj.status === 'falling' && newBuffer.endsWith(obj.text.toLowerCase())
                );
                
                if (matchedObject) {
                    setScore(prev => prev + matchedObject.text.length);
                    setKeyBuffer("");
                    return currentObjects.map(obj => 
                        obj.id === matchedObject.id ? { ...obj, status: 'bursting' } : obj
                    );
                }
                return currentObjects;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [gameState, keyBuffer]);
    
     useEffect(() => {
        const burstingObjects = fallingObjects.filter(obj => obj.status === 'bursting');
        if (burstingObjects.length > 0) {
            const timer = setTimeout(() => {
                setFallingObjects(prev => prev.filter(obj => obj.status !== 'bursting'));
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [fallingObjects]);


    useEffect(() => {
        if (gameState === "playing") {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
            spawnIntervalRef.current = setInterval(spawnObject, DIFFICULTY_SETTINGS[difficulty].spawnRate);
            timerIntervalRef.current = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
        } else {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }

        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState, gameLoop, spawnObject, difficulty]);
    
    useEffect(() => {
        restartGame();
    }, [restartGame, difficulty]);

    const renderOverlay = () => {
        if (gameState === 'paused') {
            return (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                   <h2 className="text-4xl font-bold text-white">Paused</h2>
                   <Button onClick={resumeGame} className="mt-4 bg-accent text-accent-foreground"><Play className="mr-2" /> Resume</Button>
               </div>
           );
        }
        if (gameState === 'gameOver') {
            return (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm text-center p-4">
                   <Trophy size={64} className="mx-auto text-destructive" />
                   <h2 className="text-4xl font-bold mt-4 text-white">Game Over</h2>
                   <p className="text-2xl mt-2 text-slate-200">Final Score: {score}</p>
                   <div className="flex justify-center gap-4 mt-8">
                       <Button onClick={onBack} variant="outline" size="lg">Change Puzzle</Button>
                       <Button onClick={restartGame} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><RotateCw className="mr-2" /> Play Again</Button>
                   </div>
               </div>
           );
        }
        return null;
    }

    return (
        <>
        <AlertDialog open={gameState === 'win'}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl text-green-600 flex items-center justify-center gap-2">
                       <Award size={28} /> Round Complete!
                    </AlertDialogTitle>
                </AlertDialogHeader>
                 <div className="py-4 text-center">
                    {isCalculatingReward ? (
                        <div className="flex flex-col items-center justify-center gap-2 pt-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Calculating your awesome rewards...</p>
                        </div>
                    ) : lastReward ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <StarRating rating={lastReward.stars} />
                            <AlertDialogDescription className="text-center text-base pt-2">
                                Congratulations! You survived.
                                <br />
                                <strong className="text-lg">Final Score: {score}</strong>
                            </AlertDialogDescription>
                            <div className="flex items-center gap-6 mt-2">
                                <span className="flex items-center font-bold text-2xl">
                                    +{lastReward.points} <SPointsIcon className="ml-2 h-7 w-7 text-yellow-400" />
                                </span>
                                <span className="flex items-center font-bold text-2xl">
                                    +{lastReward.coins} <SCoinsIcon className="ml-2 h-7 w-7 text-amber-500" />
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={restartGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                    <AlertDialogCancel onClick={onBack} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Card className="w-full h-full flex flex-col shadow-lg relative">
            <CardHeader className="bg-primary/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Keyboard size={28} className="text-primary" />
                        <CardTitle className="text-2xl font-bold text-primary">Typing Rush</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={gameState === 'playing' ? pauseGame : resumeGame} variant="outline" size="icon" disabled={gameState === 'gameOver' || gameState === 'win'}>
                            {gameState === 'playing' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={onBack}>
                            <ArrowLeft size={16} className="mr-1" /> Back
                        </Button>
                    </div>
                </div>
                <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                    <span className="font-semibold text-lg">Score: <span className="text-accent">{score}</span></span>
                    <span className="capitalize">Difficulty: {difficulty}</span>
                    <span className="font-semibold text-lg flex items-center">
                        Lives:
                        <div className="flex ml-2">
                            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                                <Heart key={i} className={cn("h-5 w-5 transition-colors", i < lives ? "text-red-500 fill-current" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                    </span>
                </CardDescription>
                <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full mt-2" />
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-grow">
                <div 
                    ref={gameAreaRef} 
                    className="relative bg-primary/5 rounded-lg overflow-hidden border shadow-inner w-full flex-grow min-h-[400px]"
                >
                    {renderOverlay()}
                    {fallingObjects.map(obj => (
                        <div
                            key={obj.id}
                            className={cn(
                                "absolute text-lg font-bold text-white flex items-center justify-center rounded-full shadow-lg",
                                "w-16 h-16 border-2",
                                obj.color,
                                { 'animate-burst': obj.status === 'bursting' }
                            )}
                            style={{
                                left: `${obj.x}%`,
                                top: `${obj.y}px`,
                                transform: "translateX(-50%)",
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            }}
                        >
                            {obj.status === 'falling' && obj.text}
                        </div>
                    ))}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/20 text-white font-mono p-2 rounded-lg text-lg tracking-widest min-w-[150px] text-center">
                        {keyBuffer || '...'}
                    </div>
                </div>
                 <p className="text-center text-sm text-muted-foreground mt-2">
                    {gameState === 'playing' ? 'Start typing the falling words!' : 'Game is paused.'}
                </p>
            </CardContent>
        </Card>
        </>
    );
}
