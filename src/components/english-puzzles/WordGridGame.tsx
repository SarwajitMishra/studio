
"use client";

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LayoutGrid, ArrowLeft, RotateCw, SkipForward, Loader2, Award, Star as StarIcon, Shrink } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { updateGameStats } from "@/lib/progress";
import { getWordDefinition } from '@/ai/flows/get-word-definition-flow';
import { calculateRewards, applyRewards } from '@/lib/rewards';
import { S_POINTS_ICON as SPointsIcon, S_COINS_ICON as SCoinsIcon } from '@/lib/constants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFullscreen } from '@/hooks/use-fullscreen';

const LARGE_DICTIONARY = ['ace', 'act', 'add', 'ado', 'aft', 'age', 'ago', 'aid', 'ail', 'aim', 'air', 'ale', 'all', 'amp', 'and', 'ant', 'any', 'ape', 'apt', 'arc', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'asp', 'ate', 'awe', 'axe', 'aye', 'bad', 'bag', 'ban', 'bat', 'bed', 'bee', 'beg', 'bet', 'bid', 'big', 'bin', 'bit', 'boa', 'bog', 'boo', 'bow', 'box', 'boy', 'bud', 'bug', 'bum', 'bun', 'bus', 'but', 'buy', 'bye', 'cab', 'cad', 'cam', 'can', 'cap', 'car', 'cat', 'caw', 'cay', 'cob', 'cod', 'cog', 'con', 'coo', 'cop', 'cot', 'cow', 'coy', 'cry', 'cub', 'cud', 'cue', 'cup', 'cur', 'cut', 'dab', 'dad', 'dam', 'day', 'den', 'dew', 'did', 'die', 'dig', 'dim', 'din', 'dip', 'doe', 'dog', 'don', 'dot', 'dry', 'dub', 'dud', 'due', 'dug', 'dun', 'duo', 'dye', 'ear', 'eat', 'ebb', 'eel', 'egg', 'ego', 'eke', 'elf', 'elk', 'elm', 'end', 'era', 'ere', 'erg', 'err', 'eve', 'ewe', 'eye', 'fad', 'fag', 'fan', 'far', 'fat', 'fay', 'fed', 'fee', 'fen', 'few', 'fey', 'fez', 'fib', 'fig', 'fin', 'fir', 'fit', 'fix', 'flu', 'fly', 'fob', 'foe', 'fog', 'for', 'fox', 'fry', 'fun', 'fur', 'gab', 'gad', 'gag', 'gal', 'gap', 'gas', 'gay', 'gel', 'gem', 'get', 'gig', 'gin', 'gip', 'gnu', 'goa', 'gob', 'god', 'goo', 'got', 'gum', 'gun', 'gut', 'guy', 'gym', 'had', 'hag', 'ham', 'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hew', 'hex', 'hey', 'hid', 'hie', 'him', 'hin', 'hip', 'his', 'hit', 'hoe', 'hog', 'hon', 'hop', 'hot', 'how', 'hub', 'hue', 'hug', 'hum', 'hun', 'hut', 'ice', 'icy', 'igg', 'ill', 'imp', 'ink', 'inn', 'ion', 'ire', 'irk', 'ism', 'its', 'ivy', 'jab', 'jag', 'jam', 'jar', 'jaw', 'jay', 'jet', 'jew', 'jib', 'jig', 'job', 'jog', 'jot', 'joy', 'jug', 'jun', 'jus', 'jut', 'keg', 'ken', 'key', 'kid', 'kin', 'kip', 'kit', 'koa', 'koi', 'lab', 'lad', 'lag', 'lam', 'lap', 'law', 'lay', 'lea', 'led', 'lee', 'leg', 'let', 'lid', 'lie', 'lip', 'lit', 'log', 'lop', 'lot', 'low', 'lux', 'lye', 'mad', 'man', 'map', 'mar', 'mat', 'may', 'men', 'met', 'mew', 'mid', 'mil', 'mix', 'moa', 'mob', 'mod', 'moo', 'mop', 'mow', 'mud', 'mug', 'mum', 'nab', 'nag', 'nap', 'nay', 'neb', 'net', 'new', 'nib', 'nil', 'nip', 'nit', 'nix', 'nob', 'nod', 'noo', 'nor', 'not', 'now', 'nub', 'nun', 'nut', 'oaf', 'oak', 'oar', 'oat', 'odd', 'ode', 'off', 'oft', 'ohm', 'oho', 'oil', 'old', 'one', 'orb', 'ore', 'our', 'out', 'owe', 'owl', 'own', 'pad', 'pal', 'pan', 'pap', 'par', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pep', 'per', 'pet', 'pew', 'phi', 'pie', 'pig', 'pin', 'pip', 'pit', 'ply', 'pod', 'poi', 'pol', 'pop', 'pot', 'pro', 'pry', 'pub', 'pug', 'pun', 'pup', 'pus', 'put', 'rad', 'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'rep', 'rev', 'rib', 'rid', 'rig', 'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rue', 'rug', 'rum', 'run', 'rye', 'sab', 'sac', 'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'see', 'set', 'sew', 'sex', 'she', 'shy', 'sin', 'sip', 'sir', 'sis', 'sit', 'ski', 'sky', 'sly', 'sod', 'sol', 'son', 'sop', 'sow', 'soy', 'spa', 'spy', 'sty', 'sub', 'sue', 'sum', 'sun', 'sup', 'tab', 'tad', 'tag', 'tam', 'tan', 'tap', 'tar', 'tat', 'tau', 'tax', 'tea', 'ted', 'tee', 'ten', 'the', 'thy', 'tic', 'tie', 'til', 'tin', 'tip', 'tit', 'toe', 'tog', 'tom', 'ton', 'too', 'top', 'tor', 'tow', 'toy', 'try', 'tub', 'tug', 'tun', 'two', 'use', 'van', 'vat', 'vet', 'vie', 'vow', 'wad', 'wag', 'wan', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'woe', 'wok', 'won', 'woo', 'wow', 'wry', 'wye', 'yah', 'yak', 'yam', 'yap', 'yaw', 'yea', 'yen', 'yep', 'yes', 'yet', 'yew', 'yin', 'yip', 'yob', 'yon', 'you', 'yow', 'yuk', 'yum', 'yup', 'zag', 'zap', 'zed', 'zee', 'zen', 'zig', 'zip', 'zoo', 'able', 'acid', 'acne', 'acre', 'acts', 'adds', 'aged', 'ages', 'ahem', 'aide', 'aids', 'aims', 'airs', 'airy', 'ajar', 'akin', 'alas', 'ales', 'alga', 'ally', 'alms', 'aloe', 'also', 'alto', 'amen', 'amid', 'ammo', 'amok', 'amps', 'anal', 'anch', 'and', 'ants', 'any', 'apes', 'apex', 'aqua', 'arch', 'area', 'ares', 'aria', 'arid', 'arks', 'arms', 'army', 'arts', 'arty', 'ashy', 'atop', 'aunt', 'aura', 'auto', 'avid', 'avow', 'away', 'awed', 'awes', 'awol', 'axis', 'axle', 'babe', 'baby', 'back', 'bade', 'bags', 'bail', 'bait', 'bake', 'bald', 'bale', 'balk', 'ball', 'band', 'bane', 'bang', 'bank', 'barb', 'bard', 'bare', 'barf', 'bark', 'barn', 'bars', 'base', 'bash', 'bask', 'bass', 'bast', 'bath', 'bats', 'bead', 'beak', 'beam', 'bean', 'bear', 'beat', 'beau', 'beck', 'beds', 'beef', 'been', 'beep', 'beer', 'bees', 'beet', 'begs', 'bell', 'belt', 'bend', 'bent', 'berg', 'best', 'beta', 'bets', 'bevy', 'bias', 'bibs', 'bide', 'bids', 'bike', 'bile', 'bilk', 'bill', 'bind', 'bins', 'bird', 'bite', 'bits', 'blab', 'blah', 'bled', 'blew', 'blip', 'blob', 'bloc', 'blot', 'blow', 'blue', 'blur', 'boar', 'boas', 'boat', 'bobs', 'bode', 'body', 'bogs', 'boil', 'bold', 'bolt', 'bomb', 'bond', 'bone', 'bong', 'bony', 'boob', 'book', 'boom', 'boon', 'boor', 'boos', 'boot', 'bore', 'born', 'boss', 'both', 'bout', 'bowl', 'bows', 'boys', 'brag', 'bran', 'bras', 'brat', 'bray', 'bred', 'brew', 'brie', 'brig', 'brim', 'brow', 'buck', 'buds', 'bugs', 'bulb', 'bulk', 'bull', 'bums', 'buns', 'bunt', 'buoy', 'burg', 'burn', 'burp', 'burr', 'bury', 'bush', 'busk', 'buss', 'bust', 'busy', 'buts', 'buys', 'buzz', 'byes', 'byte', 'cabs', 'cads', 'cafe', 'cage', 'cake', 'calf', 'call', 'calm', 'came', 'camo', 'camp', 'cams', 'cane', 'cans', 'cape', 'caps', 'card', 'care', 'carp', 'cars', 'cart', 'case', 'cash', 'cask', 'cast', 'cats', 'cave', 'caws', 'ceca', 'cell', 'cent', 'cess', 'chap', 'char', 'chat', 'chef', 'chew', 'chic', 'chin', 'chip', 'chop', 'chug', 'chum', 'cite', 'city', 'clam', 'clan', 'clap', 'claw', 'clay', 'clip', 'clod', 'clog', 'clot', 'club', 'clue', 'coal', 'coat', 'coax', 'cobs', 'cock', 'coco', 'cods', 'cogs', 'coif', 'coil', 'coin', 'coke', 'cola', 'cold', 'colt', 'coma', 'comb', 'come', 'cone', 'conk', 'cons', 'cook', 'cool', 'coon', 'coop', 'coos', 'coot', 'cops', 'copy', 'cord', 'core', 'cork', 'corn', 'cost', 'cots', 'cove', 'cowl', 'cows', 'cozy', 'crab', 'crag', 'cram', 'crap', 'craw', 'crew', 'crib', 'crop', 'crow', 'crud', 'cube', 'cubs', 'cuds', 'cues', 'cuff', 'cull', 'cult', 'cunt', 'cups', 'curb', 'curd', 'cure', 'curl', 'curs', 'curt', 'cusp', 'cuss', 'cute', 'cuts', 'cyan', 'cyst', 'czar', 'dabs', 'dace', 'dads', 'daft', 'dais', 'dame', 'damn', 'damp', 'dams', 'dank', 'dare', 'dark', 'darn', 'dart', 'dash', 'data', 'date', 'daub', 'dawn', 'days', 'daze', 'dead', 'deaf', 'deal', 'dean', 'dear', 'debt', 'deck', 'deed', 'deem', 'deep', 'deer', 'deft', 'defy', 'deli', 'dell', 'demo', 'dens', 'dent', 'deny', 'desk', 'dews', 'dewy', 'dial', 'dice', 'dick', 'died', 'dies', 'diet', 'digs', 'dike', 'dill', 'dime', 'dims', 'dine', 'ding', 'dins', 'dint', 'dips', 'dire', 'dirt', 'disc', 'dish', 'disk', 'diva', 'dive', 'dock', 'docs', 'dodo', 'doer', 'does', 'doff', 'dogs', 'dole', 'doll', 'dolt', 'dome', 'done', 'dons', 'doom', 'door', 'dope', 'dork', 'dorm', 'dory', 'dose', 'dote', 'dots', 'dour', 'dove', 'down', 'doze', 'dozy', 'drab', 'drag', 'dram', 'drat', 'draw', 'dray', 'drew', 'drip', 'drop', 'drub', 'drug', 'drum', 'drys', 'dual', 'dubs', 'duck', 'duct', 'dude', 'duds', 'duel', 'dues', 'duet', 'duff', 'duke', 'dull', 'duly', 'dumb', 'dump', 'dune', 'dung', 'dunk', 'duns', 'duos', 'dusk', 'dust', 'duty', 'dwarf', 'dyed', 'dyer', 'dyes', 'dying', 'dyke', 'each', 'earl', 'earn', 'ears', 'ease', 'east', 'easy', 'eats', 'eave', 'ebbs', 'echo', 'ecru', 'eddy', 'edge', 'edgy', 'edit', 'eels', 'eery', 'egos', 'eked', 'ekes', 'elks', 'ells', 'elms', 'else', 'emir', 'emit', 'emus', 'ends', 'envy', 'eons', 'epic', 'eras', 'ergo', 'ergs', 'errs', 'etch', 'euro', 'even', 'ever', 'eves', 'evil', 'ewes', 'exam', 'exec', 'exit', 'expo', 'eyed', 'eyes', 'face', 'fact', 'fade', 'fads', 'fags', 'fail', 'fain', 'fair', 'fait', 'fake', 'fall', 'fame', 'fang', 'fans', 'fare', 'farm', 'fart', 'fast', 'fate', 'fats', 'faun', 'fawn', 'faze', 'fear', 'feat', 'feds', 'feed', 'feel', 'fees', 'feet', 'fell', 'felt', 'fend', 'fens', 'fern', 'fess', 'feud', 'fiat', 'fibs', 'fief', 'figs', 'file', 'fill', 'film', 'filo', 'find', 'fine', 'fink', 'fins', 'fire', 'firm', 'firs', 'fish', 'fist', 'fits', 'five', 'fizz', 'flab', 'flag', 'flak', 'flan', 'flap', 'flat', 'flaw', 'flax', 'flay', 'flea', 'fled', 'flee', 'flew', 'flex', 'flip', 'flit', 'floc', 'floe', 'flog', 'flop', 'flow', 'flub', 'flue', 'flux', 'foal', 'foam', 'fobs', 'foci', 'foes', 'fogs', 'fogy', 'foil', 'fold', 'folk', 'fond', 'font', 'food', 'fool', 'foot', 'fops', 'fora', 'ford', 'fore', 'fork', 'form', 'fort', 'foul', 'four', 'fowl', 'foxes', 'foxy', 'fray', 'free', 'fret', 'frog', 'from', 'fuel', 'full', 'fume', 'fund', 'funk', 'furl', 'furs', 'fury', 'fuse', 'fuss', 'futz', 'fuzz', 'gaff', 'gaga', 'gage', 'gags', 'gait', 'gala', 'gale', 'gall', 'gals', 'game', 'gamy', 'gang', 'gape', 'gaps', 'garb', 'gash', 'gasp', 'gate', 'gave', 'gawk', 'gawp', 'gays', 'gaze', 'gear', 'geek', 'gees', 'geld', 'gels', 'gems', 'gene', 'gent', 'germ', 'gets', 'gibe', 'gift', 'gild', 'gill', 'gilt', 'gimp', 'gins', 'gird', 'girl', 'girt', 'gist', 'give', 'glad', 'glee', 'glen', 'glib', 'glob', 'gloom', 'glow', 'glue', 'glum', 'glut', 'gnat', 'gnaw', 'gnus', 'goad', 'goal', 'goas', 'goat', 'gobs', 'gods', 'goes', 'gold', 'golf', 'gone', 'gong', 'good', 'goof', 'goon', 'goop', 'gore', 'gory', 'gosh', 'goth', 'gout', 'gown', 'gowns', 'grab', 'grad', 'gram', 'gran', 'gray', 'grew', 'grey', 'grid', 'grim', 'grin', 'grip', 'grit', 'grog', 'grot', 'grow', 'grub', 'gull', 'gulp', 'gums', 'gunk', 'guns', 'guru', 'gush', 'gust', 'guts', 'guys', 'gyms', 'gyp', 'gyro', 'hack', 'had', 'haft', 'hags', 'hail', 'hair', 'haji', 'hake', 'hale', 'half', 'hall', 'halo', 'halt', 'hams', 'hand', 'hang', 'hank', 'hard', 'hark', 'harm', 'harp', 'hart', 'hash', 'hasp', 'hast', 'hate', 'hats', 'haul', 'have', 'hawk', 'hays', 'haze', 'hazy', 'head', 'heal', 'heap', 'hear', 'heat', 'heck', 'heed', 'heel', 'heft', 'heir', 'held', 'hell', 'helm', 'help', 'hemp', 'hems', 'hens', 'herb', 'herd', 'here', 'hero', 'hers', 'hewn', 'hews', 'hick', 'hide', 'hied', 'hies', 'high', 'hike', 'hill', 'hilt', 'hims', 'hind', 'hins', 'hint', 'hips', 'hire', 'hiss', 'hist', 'hits', 'hive', 'hoar', 'hoax', 'hobo', 'hobs', 'hods', 'hoed', 'hoes', 'hogs', 'hoke', 'hold', 'hole', 'holo', 'holy', 'home', 'homo', 'homy', 'hone', 'honk', 'hood', 'hoof', 'hook', 'hoop', 'hoot', 'hope', 'hopi', 'hops', 'hora', 'horn', 'hors', 'hose', 'host', 'hots', 'hour', 'hove', 'howl', 'hubs', 'hued', 'hues', 'huff', 'huge', 'hugs', 'hula', 'hulk', 'hull', 'hump', 'hums', 'hung', 'hunk', 'huns', 'hunt', 'hurl', 'hurt', 'hush', 'husk', 'hymn', 'hype', 'hypo', 'iamb', 'ibex', 'ibis', 'iced', 'ices', 'icky', 'icon', 'idea', 'ides', 'idle', 'idly', 'idol', 'iffy', 'ikon', 'ilks', 'ills', 'imam', 'imps', 'inch', 'info', 'inks', 'inky', 'inly', 'inns', 'into', 'ions', 'iota', 'iran', 'iraq', 'ired', 'ires', 'iris', 'irks', 'iron', 'isle', 'itch', 'item', 'ivies', 'ivory', 'jabs', 'jack', 'jade', 'jags', 'jail', 'jamb', 'jams', 'jape', 'jars', 'java', 'jaws', 'jays', 'jazz', 'jeep', 'jeer', 'jeez', 'jell', 'jerk', 'jest', 'jets', 'jews', 'jibe', 'jibs', 'jiff', 'jigs', 'jilt', 'jinn', 'jinx', 'jive', 'jobs', 'jock', 'jogs', 'john', 'join', 'joke', 'joky', 'jolt', 'josh', 'jost', 'jots', 'jour', 'jowl', 'joys', 'judo', 'jugs', 'juju', 'juke', 'july', 'jump', 'june', 'junk', 'juno', 'jury', 'just', 'jute', 'juts', 'kale', 'kart', 'keel', 'keen', 'keep', 'kegs', 'kelp', 'keno', 'kens', 'kept', 'kerb', 'keys', 'khan', 'kick', 'kids', 'kill', 'kiln', 'kilo', 'kilt', 'kind', 'king', 'kink', 'kips', 'kiss', 'kist', 'kite', 'kits', 'kiwi', 'knab', 'knap', 'knee', 'knew', 'knit', 'knob', 'knot', 'know', 'koan', 'kohl', 'kola', 'kudo', 'kung', 'labs', 'lace', 'lack', 'lacy', 'lade', 'lads', 'lady', 'lags', 'laid', 'lain', 'lair', 'lake', 'lama', 'lamb', 'lame', 'lamp', 'lams', 'land', 'lane', 'lank', 'laps', 'lard', 'lark', 'lash', 'lass', 'last', 'late', 'lath', 'laud', 'lava', 'lave', 'lawn', 'laws', 'lays', 'laze', 'lazy', 'lead', 'leaf', 'leak', 'lean', 'leap', 'leas', 'leek', 'leer', 'lees', 'left', 'legs', 'leis', 'lend', 'lens', 'lent', 'less', 'lest', 'lets', 'levy', 'lewd', 'liar', 'lice', 'lick', 'lids', 'lied', 'lief', 'lien', 'lier', 'lies', 'lieu', 'life', 'lift', 'like', 'lilt', 'lily', 'limb', 'lime', 'limn', 'limo', 'limp', 'limy', 'line', 'link', 'lino', 'lint', 'lion', 'lips', 'lira', 'lire', 'lisp', 'list', 'lite', 'live', 'load', 'loaf', 'loam', 'loan', 'lobe', 'lobs', 'loci', 'lock', 'loco', 'lode', 'loft', 'loge', 'logo', 'logs', 'logy', 'loin', 'loll', 'lone', 'long', 'look', 'loom', 'loon', 'loop', 'loot', 'lope', 'lops', 'lord', 'lore', 'lorn', 'lose', 'loss', 'lost', 'loth', 'lots', 'loud', 'lour', 'lout', 'love', 'lows', 'luau', 'luck', 'lucy', 'luge', 'lugs', 'lull', 'lulu', 'lump', 'luna', 'lune', 'lung', 'lure', 'lurk', 'lush', 'lust', 'lute', 'luxe', 'lyes', 'lynch', 'lynx', 'lyre', 'mace', 'mach', 'mack', 'macs', 'made', 'mads', 'mage', 'magi', 'mags', 'maid', 'mail', 'maim', 'main', 'make', 'male', 'mall', 'malt', 'mama', 'mana', 'mane', 'mans', 'many', 'maps', 'mare', 'mark', 'mars', 'mart', 'mash', 'mask', 'mass', 'mast', 'mate', 'math', 'mats', 'maul', 'maws', 'mayo', 'maze', 'mead', 'meal', 'mean', 'meat', 'meek', 'meet', 'meld', 'melt', 'memo', 'mend', 'menu', 'meow', 'mere', 'mesa', 'mesh', 'mess', 'mete', 'mewl', 'mews', 'mica', 'mice', 'mick', 'midi', 'mids', 'mien', 'mike', 'mild', 'mile', 'milk', 'mill', 'mils', 'milt', 'mime', 'mind', 'mine', 'mini', 'mink', 'mint', 'minx', 'mire', 'miry', 'misc', 'miso', 'miss', 'mist', 'mite', 'mitt', 'mixt', 'moan', 'moat', 'mobs', 'mock', 'mode', 'modi', 'mods', 'moil', 'mold', 'mole', 'moll', 'molt', 'moms', 'monk', 'mono', 'mood', 'moos', 'moot', 'mope', 'mops', 'more', 'morn', 'mort', 'moss', 'most', 'mote', 'moth', 'mots', 'moue', 'move', 'mown', 'mows', 'much', 'muck', 'muds', 'muff', 'mugs', 'mule', 'mull', 'mums', 'murk', 'muse', 'mush', 'musk', 'muss', 'must', 'mute', 'mutt', 'myna', 'myth', 'nabs', 'nags', 'naif', 'nail', 'name', 'nape', 'naps', 'narc', 'nard', 'nark', 'nary', 'nave', 'navy', 'nays', 'nazi', 'near', 'neat', 'neck', 'need', 'neap', 'nerd', 'nest', 'nets', 'newt', 'next', 'nibs', 'nice', 'nick', 'nigh', 'nile', 'nils', 'nips', 'nits', 'nix', 'nobs', 'node', 'nods', 'noel', 'noes', 'none', 'nook', 'noon', 'norm', 'nose', 'nosh', 'nosy', 'note', 'noth', 'noun', 'nous', 'nova', 'noway', 'nude', 'nuke', 'null', 'numb', 'nuns', 'nuts', 'oafs', 'oaks', 'oars', 'oath', 'oats', 'obey', 'obis', 'oboe', 'odds', 'odes', 'odin', 'ogle', 'ogre', 'ohio', 'ohms', 'oils', 'oily', 'oink', 'okay', 'okra', 'olds', 'oldy', 'oleo', 'omen', 'omit', 'once', 'ones', 'only', 'onto', 'onus', 'onyx', 'oohs', 'ooze', 'oozy', 'opal', 'opec', 'open', 'opts', 'opus', 'oral', 'orbs', 'ores', 'orgy', 'ouch', 'ours', 'oust', 'outs', 'ouzo', 'oval', 'oven', 'over', 'overt', 'ovum', 'owed', 'owes', 'owls', 'owns', 'oxen', 'pace', 'pack', 'pact', 'pads', 'page', 'paid', 'pail', 'pain', 'pair', 'pale', 'pall', 'palm', 'pals', 'pane', 'pang', 'pans', 'pant', 'papa', 'paps', 'para', 'pard', 'pare', 'park', 'pars', 'part', 'pas', 'past', 'pate', 'path', 'pats', 'pave', 'pawl', 'pawn', 'paws', 'pays', 'peak', 'peal', 'pean', 'pear', 'peas', 'peat', 'peck', 'pecs', 'peed', 'peek', 'peel', 'peen', 'peep', 'peer', 'pees', 'pegs', 'pelf', 'pelt', 'pend', 'pens', 'pent', 'peon', 'peps', 'perk', 'perm', 'pert', 'peru', 'peso', 'pest', 'pets', 'pews', 'pica', 'pick', 'pics', 'pied', 'pier', 'pies', 'pigs', 'pike', 'pile', 'pill', 'pimp', 'pine', 'ping', 'pink', 'pins', 'pint', 'piny', 'pion', 'pipe', 'pips', 'piss', 'pita', 'pith', 'pits', 'pity', 'pixy', 'plan', 'plat', 'play', 'plea', 'pleb', 'pled', 'plod', 'plop', 'plot', 'plow', 'ploy', 'plug', 'plum', 'plus', 'pock', 'pods', 'poem', 'poet', 'pogo', 'pois', 'poke', 'poky', 'pole', 'poll', 'polo', 'pomp', 'pond', 'pone', 'pong', 'pony', 'pooh', 'pool', 'poop', 'poor', 'pope', 'pops', 'pore', 'pork', 'porn', 'port', 'pose', 'posh', 'post', 'posy', 'pots', 'pouf', 'pour', 'pout', 'pram', 'prat', 'pray', 'prep', 'prey', 'prig', 'prim', 'pro', 'prod', 'prof', 'prom', 'prop', 'prow', 'pubs', 'puck', 'puds', 'puff', 'pugs', 'puke', 'pule', 'pull', 'pulp', 'puma', 'pump', 'puna', 'punk', 'puns', 'punt', 'puny', 'pupa', 'pups', 'pure', 'purl', 'purr', 'push', 'puss', 'puts', 'putt', 'pyre', 'quad', 'quay', 'quid', 'quin', 'quip', 'quit', 'quiz', 'race', 'rack', 'racy', 'raft', 'raga', 'rage', 'rags', 'raid', 'rail', 'rain', 'rake', 'ramp', 'rams', 'rand', 'rang', 'rank', 'rant', 'raps', 'rapt', 'rare', 'rash', 'rasp', 'rate', 'rats', 'rave', 'raws', 'rays', 'raze', 'read', 'real', 'ream', 'reap', 'rear', 'rebs', 'reck', 'reds', 'reed', 'reef', 'reek', 'reel', 'refs', 'reid', 'rein', 'rely', 'rems', 'rend', 'rent', 'reps', 'rest', 'revs', 'rhos', 'rhyme', 'ribs', 'rice', 'rich', 'rick', 'ride', 'rids', 'rife', 'riff', 'rift', 'rigs', 'rile', 'rill', 'rime', 'rims', 'rind', 'ring', 'rink', 'rinse', 'riot', 'ripe', 'rips', 'rise', 'risk', 'rite', 'ritz', 'road', 'roam', 'roan', 'roar', 'robe', 'robs', 'rock', 'rocs', 'rode', 'rods', 'roes', 'roil', 'role', 'rolf', 'roll', 'romp', 'rood', 'roof', 'rook', 'room', 'root', 'rope', 'ropy', 'rosa', 'rose', 'rosy', 'rote', 'rots', 'rout', 'roux', 'rove', 'rows', 'rube', 'rubs', 'ruby', 'rude', 'rued', 'rues', 'ruff', 'rugs', 'ruin', 'rule', 'rump', 'rums', 'rune', 'rung', 'runs', 'runt', 'ruse', 'rush', 'rusk', 'rust', 'ruts', 'sack', 'sacs', 'safe', 'saga', 'sage', 'sago', 'sags', 'said', 'sail', 'sake', 'saki', 'sale', 'salt', 'same', 'sand', 'sane', 'sang', 'sank', 'sans', 'saps', 'sari', 'sash', 'sate', 'save', 'sawn', 'saws', 'says', 'scab', 'scad', 'scam', 'scan', 'scar', 'scat', 'scow', 'scud', 'scum', 'seal', 'seam', 'sear', 'seas', 'seat', 'secs', 'sect', 'seed', 'seek', 'seem', 'seen', 'seep', 'seer', 'sees', 'self', 'sell', 'send', 'sent', 'serb', 'sere', 'serf', 'sets', 'sewn', 'sews', 'sexy', 'shad', 'shag', 'shah', 'sham', 'shat', 'shay', 'shed', 'shim', 'shin', 'ship', 'shit', 'shod', 'shoe', 'shoo', 'shop', 'shot', 'show', 'shun', 'shut', 'siam', 'sibs', 'sick', 'side', 'sift', 'sigh', 'sign', 'sikh', 'silk', 'sill', 'silo', 'silt', 'sine', 'sing', 'sink', 'sins', 'sips', 'sire', 'sirs', 'site', 'sits', 'size', 'skew', 'skid', 'skim', 'skin', 'skip', 'skis', 'skit', 'slab', 'slag', 'slam', 'slap', 'slat', 'slay', 'sled', 'slew', 'slid', 'slim', 'slip', 'slit', 'slob', 'sloe', 'slog', 'slop', 'slot', 'slow', 'slue', 'slug', 'slum', 'slur', 'slut', 'smog', 'smug', 'smut', 'snag', 'snap', 'snip', 'snit', 'snob', 'snot', 'snow', 'snub', 'snug', 'soak', 'soap', 'soar', 'sobs', 'sock', 'soda', 'sods', 'sofa', 'soft', 'soil', 'sold', 'sole', 'soli', 'solo', 'some', 'song', 'sons', 'soon', 'soot', 'sops', 'sore', 'sort', 'soul', 'soup', 'sour', 'sown', 'sows', 'soya', 'soys', 'spam', 'span', 'spar', 'spas', 'spat', 'spay', 'spec', 'sped', 'spew', 'spin', 'spit', 'spot', 'spry', 'spud', 'spun', 'spur', 'stab', 'stag', 'star', 'stat', 'stay', 'stem', 'step', 'stet', 'stew', 'stir', 'stoa', 'stop', 'stow', 'stub', 'stud', 'stun', 'stye', 'styx', 'subs', 'such', 'suck', 'suds', 'sued', 'sues', 'suet', 'suit', 'sulk', 'sumo', 'sump', 'sums', 'sung', 'sunk', 'suns', 'sups', 'sure', 'surf', 'suss', 'swab', 'swag', 'swam', 'swan', 'swap', 'swat', 'sway', 'swig', 'swim', 'swum', 'sync', 'tabs', 'tabu', 'tack', 'taco', 'tact', 'tads', 'tags', 'tail', 'take', 'tale', 'talk', 'tall', 'tame', 'tamp', 'tams', 'tang', 'tank', 'tans', 'tape', 'taps', 'tare', 'tarn', 'taro', 'tarp', 'tars', 'tart', 'task', 'tate', 'tats', 'taut', 'taxi', 'teak', 'teal', 'team', 'tear', 'teas', 'teat', 'teds', 'teed', 'teem', 'teen', 'tees', 'tell', 'tend', 'tens', 'tent', 'term', 'tern', 'test', 'text', 'than', 'that', 'thaw', 'thee', 'them', 'then', 'they', 'thin', 'this', 'thou', 'thud', 'thug', 'thus', 'tick', 'tics', 'tide', 'tidy', 'tied', 'tier', 'ties', 'tiff', 'tile', 'till', 'tilt', 'time', 'tine', 'tins', 'tint', 'tiny', 'tipi', 'tips', 'tire', 'tits', 'toad', 'toed', 'toes', 'toga', 'togs', 'toil', 'toke', 'told', 'toll', 'tomb', 'tome', 'toms', 'tone', 'tong', 'tons', 'tony', 'took', 'tool', 'toot', 'tops', 'tore', 'torn', 'tort', 'tory', 'toss', 'tote', 'tots', 'tour', 'tout', 'town', 'tows', 'toys', 'trace', 'track', 'trade', 'trag', 'tram', 'trap', 'tray', 'tree', 'trek', 'trig', 'trim', 'trio', 'trip', 'trod', 'trot', 'troy', 'true', 'trug', 'try', 'tsar', 'tuba', 'tube', 'tubs', 'tuck', 'tuff', 'tuft', 'tugs', 'tuna', 'tune', 'tuns', 'turd', 'turf', 'turn', 'tush', 'tusk', 'tuts', 'tutu', 'twas', 'twig', 'twin', 'twit', 'twos', 'tyke', 'type', 'typo', 'tyro', 'ugli', 'ugly', 'ulna', 'ultra', 'ump', 'undo', 'unit', 'unite', 'unto', 'upon', 'urea', 'urge', 'uric', 'urns', 'usa', 'used', 'user', 'uses', 'ussr', 'utah', 'vail', 'vain', 'vale', 'valet', 'vamp', 'van', 'vane', 'vans', 'vary', 'vase', 'vast', 'vats', 'veal', 'veep', 'veer', 'veil', 'vein', 'veld', 'vend', 'vent', 'verb', 'very', 'vest', 'veto', 'vets', 'vial', 'vibe', 'vice', 'vied', 'vies', 'view', 'vile', 'vine', 'vino', 'viny', 'viol', 'visa', 'vise', 'vita', 'void', 'vole', 'volt', 'vote', 'vows', 'wack', 'wade', 'wads', 'waft', 'wage', 'wags', 'waif', 'wail', 'wait', 'wake', 'wale', 'walk', 'wall', 'wand', 'wane', 'wang', 'want', 'ward', 'ware', 'warm', 'warn', 'warp', 'wars', 'wart', 'wary', 'wash', 'wasp', 'wast', 'wats', 'watt', 'wave', 'wavy', 'waxy', 'ways', 'weak', 'weal', 'wean', 'wear', 'webs', 'weds', 'weed', 'week', 'ween', 'weep', 'weft', 'weir', 'weld', 'well', 'welt', 'wend', 'wens', 'went', 'wept', 'were', 'wert', 'west', 'wets', 'wham', 'what', 'when', 'whet', 'whew', 'whey', 'whig', 'whim', 'whip', 'whit', 'whiz', 'whoa', 'whom', 'whop', 'whys', 'wick', 'wide', 'wife', 'wigs', 'wild', 'wile', 'will', 'wilt', 'wily', 'wimp', 'wind', 'wine', 'wing', 'wink', 'wino', 'wins', 'winy', 'wipe', 'wire', 'wiry', 'wise', 'wish', 'wisp', 'wist', 'with', 'wits', 'wive', 'woes', 'woke', 'woks', 'wolf', 'womb', 'wont', 'wood', 'woof', 'wool', 'woos', 'word', 'wore', 'work', 'worm', 'worn', 'wove', 'wows', 'wrap', 'wren', 'writ', 'wyes', 'yacht', 'yaks', 'yale', 'yams', 'yang', 'yank', 'yaps', 'yard', 'yarn', 'yawl', 'yawn', 'yaws', 'yeah', 'year', 'yell', 'yelp', 'yens', 'yeti', 'yews', 'yips', 'yoga', 'yogi', 'yoke', 'yolk', 'yore', 'your', 'yowl', 'yule', 'yuks', 'yummy', 'yuppy', 'zags', 'zany', 'zaps', 'zeal', 'zebu', 'zeds', 'zees', 'zero', 'zest', 'zeta', 'zigs', 'zinc', 'zing', 'zion', 'zip', 'zips', 'ziti', 'zone', 'zoom', 'zoos', 'zulu'];

interface WordGridGameProps {
  onBack: () => void;
  difficulty: Difficulty;
}

const DICTIONARY_BY_DIFFICULTY: Record<Difficulty, string[]> = {
  easy: LARGE_DICTIONARY.filter(w => w.length >= 3 && w.length <= 4),
  medium: LARGE_DICTIONARY.filter(w => w.length >= 5 && w.length <= 6),
  hard: LARGE_DICTIONARY.filter(w => w.length >= 7 && w.length <= 8),
};

const GRID_SIZE = 4;
const GAME_DURATION_S = 120; // 2 minutes

// This function tries to place a word on the grid.
const placeWordInGrid = (word: string): { grid: string[][], success: boolean } => {
    const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    const path: {r: number, c: number}[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]].sort(() => 0.5 - Math.random());

    function tryPlace(r: number, c: number, index: number): boolean {
        if (index === word.length) return true; // Word placed successfully
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || path.some(p => p.r === r && p.c === c)) return false;

        path.push({r, c});
        grid[r][c] = word[index].toUpperCase();

        for (const [dr, dc] of directions) {
            if (tryPlace(r + dr, c + dc, index + 1)) {
                return true;
            }
        }
        
        path.pop(); // Backtrack
        grid[r][c] = '';
        return false;
    }
    
    // Try placing the word starting from a random position
    const startPositions = Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => ({ r: Math.floor(i / GRID_SIZE), c: i % GRID_SIZE })).sort(() => 0.5 - Math.random());
    for(const {r,c} of startPositions){
        if(tryPlace(r, c, 0)){
             // Fill the rest of the grid with random letters
            for (let row = 0; row < GRID_SIZE; row++) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    if (grid[row][col] === '') {
                        grid[row][col] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
                    }
                }
            }
            return { grid, success: true };
        }
    }
    
    return { grid, success: false }; // Failed to place the word
};


export default function WordGridGame({ onBack, difficulty }: WordGridGameProps) {
  const [gameState, setGameState] = useState<"loading" | "playing" | "gameOver">("loading");
  const [grid, setGrid] = useState<string[][]>([]);
  const [currentPath, setCurrentPath] = useState<{r: number, c: number}[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [hint, setHint] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  const [lastReward, setLastReward] = useState<{points: number, coins: number, stars: number} | null>(null);

  const { toast } = useToast();
  const usedWords = useRef(new Set<string>());

  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(gameContainerRef);

  useEffect(() => {
    enterFullscreen();
  }, [enterFullscreen]);

  const handleExit = () => {
    exitFullscreen();
    onBack();
  }

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex justify-center">
        {[...Array(3)].map((_, i) => (
            <StarIcon key={i} className={cn("h-10 w-10", i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
        ))}
    </div>
  );

  const calculateStars = useCallback((finalScore: number): number => {
    const thresholds: Record<Difficulty, {oneStar: number, twoStars: number, threeStars: number}> = {
      easy: { oneStar: 3, twoStars: 6, threeStars: 10 },
      medium: { oneStar: 2, twoStars: 5, threeStars: 8 },
      hard: { oneStar: 1, twoStars: 3, threeStars: 5 },
    };
    const { oneStar, twoStars, threeStars } = thresholds[difficulty];
    if (finalScore >= threeStars) return 3;
    if (finalScore >= twoStars) return 2;
    if (finalScore >= oneStar) return 1;
    return 0;
  }, [difficulty]);

  const handleGameOver = useCallback(async (finalScore: number) => {
    setGameState("gameOver");
    setIsCalculatingReward(true);
    updateGameStats({ gameId: 'wordGrid', didWin: finalScore > 0, score: finalScore });

    try {
        const rewards = await calculateRewards({ gameId: 'wordGrid', difficulty, performanceMetrics: { score: finalScore }});
        const earned = applyRewards(rewards.sPoints, rewards.sCoins, `Finished Word Grid (${difficulty})`);
        const stars = calculateStars(finalScore);
        setLastReward({ points: earned.points, coins: earned.coins, stars });
    } catch(e) {
        console.error("Error calculating rewards:", e);
        toast({ variant: 'destructive', title: 'Reward Error', description: 'Could not calculate rewards.' });
    } finally {
        setIsCalculatingReward(false);
    }
  }, [difficulty, toast, calculateStars]);
  
  const loadNextWord = useCallback(async (isSkip = false) => {
    setGameState("loading");
    setCurrentPath([]);
    setCurrentWord('');
    if (isSkip && secretWord) {
        toast({ title: "Skipped!", description: `The word was "${secretWord}".`});
    }

    const dictionary = DICTIONARY_BY_DIFFICULTY[difficulty];
    const availableWords = dictionary.filter(w => !usedWords.current.has(w));
    
    if (availableWords.length === 0) {
      toast({ title: "Wow!", description: "You've gone through all the words for this difficulty!"});
      handleGameOver(score);
      return;
    }

    let word = availableWords[Math.floor(Math.random() * availableWords.length)];
    let placementResult = placeWordInGrid(word);
    
    let retries = 0;
    while(!placementResult.success && retries < 10) {
      word = availableWords[Math.floor(Math.random() * availableWords.length)];
      placementResult = placeWordInGrid(word);
      retries++;
    }

    if (!placementResult.success) {
        toast({ variant: "destructive", title: "Grid Error", description: "Couldn't create a new word grid. Please try again."});
        onBack();
        return;
    }

    usedWords.current.add(word);
    setSecretWord(word);
    setGrid(placementResult.grid);

    try {
      const definition = await getWordDefinition({ word });
      setHint(`A ${word.length}-letter word: ${definition.definition}`);
    } catch (e) {
      console.error("Failed to get hint:", e);
      setHint(`Could not load hint for this ${word.length}-letter word.`);
    }
    
    setGameState("playing");
  }, [difficulty, score, onBack, handleGameOver, secretWord, toast]);

  const resetGame = useCallback(() => {
    usedWords.current.clear();
    setScore(0);
    setTimeLeft(GAME_DURATION_S);
    setGameState("loading");
  }, []);

  useEffect(() => {
    resetGame();
  }, [difficulty, resetGame]);


  useEffect(() => {
    if (gameState === "playing") {
        const timer = setTimeout(() => {
            if (timeLeft > 0) {
                setTimeLeft(t => t - 1)
            } else {
                handleGameOver(score);
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [timeLeft, gameState, score, handleGameOver]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    
    const lastPos = currentPath[currentPath.length - 1];
    const isAlreadyInPath = currentPath.some(pos => pos.r === r && pos.c === c);

    if (isAlreadyInPath) return;

    if (currentPath.length > 0) {
      const isAdjacent = Math.abs(lastPos.r - r) <= 1 && Math.abs(lastPos.c - c) <= 1;
      if (!isAdjacent) return;
    }

    const newPath = [...currentPath, {r, c}];
    setCurrentPath(newPath);
    setCurrentWord(w => w + grid[r][c]);
  };
  
  const submitWord = () => {
    if (currentWord.toLowerCase() === secretWord) {
      setScore(s => s + 1);
      toast({ title: "Correct!", description: `You found "${secretWord}"!`, className: "bg-green-500 text-white" });
      loadNextWord();
    } else {
      toast({ variant: 'destructive', title: "Not quite!", description: `That's not the word. Keep trying!` });
      setCurrentPath([]);
      setCurrentWord('');
    }
  };

  return (
    <div ref={gameContainerRef} className={cn("w-full h-full flex items-center justify-center", isFullscreen && "bg-background")}>
      <Card className="w-full max-w-lg shadow-xl">
          <AlertDialog open={gameState === 'gameOver'}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                        <Award size={28} /> Time's Up!
                      </AlertDialogTitle>
                  </AlertDialogHeader>
                  <div className="py-4 text-center">
                      {isCalculatingReward ? (
                          <div className="flex flex-col items-center justify-center gap-2 pt-4">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Calculating your rewards...</p>
                          </div>
                      ) : lastReward ? (
                          <div className="flex flex-col items-center gap-3 text-center">
                              <StarRating rating={lastReward.stars} />
                              <AlertDialogDescription className="text-center text-base pt-2">
                                  You found <strong className="text-lg text-accent">{score}</strong> words!
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
                      <AlertDialogAction onClick={resetGame} disabled={isCalculatingReward}>Play Again</AlertDialogAction>
                      <AlertDialogCancel onClick={handleExit} disabled={isCalculatingReward}>Back to Menu</AlertDialogCancel>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>

          <CardHeader className="bg-primary/10">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                      <LayoutGrid size={28} className="text-primary" />
                      <CardTitle className="text-2xl font-bold text-primary">Find the Word</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExit}>
                    <Shrink size={16} className="mr-1" /> Exit
                  </Button>
              </div>
              <CardDescription className="text-center text-md text-foreground/80 pt-2 flex justify-between items-center px-2">
                  <span>Score: {score}</span>
                  <span>Time: {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</span>
              </CardDescription>
              <Progress value={(timeLeft / GAME_DURATION_S) * 100} className="w-full mt-2" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
              {gameState === 'loading' ? (
                  <div className='flex flex-col items-center justify-center h-[350px]'>
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="mt-4 text-muted-foreground">Loading next word...</p>
                  </div>
              ) : (
                  <>
                      <div className="p-3 bg-yellow-100/70 border border-yellow-400/50 rounded-lg text-yellow-800 text-sm text-center min-h-[4rem]">
                          <strong>Hint:</strong> {hint}
                      </div>

                      <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                          <div className="flex-shrink-0 space-y-4">
                              <div className="grid grid-cols-4 gap-2">
                                  {grid.flat().map((letter, index) => {
                                      const r = Math.floor(index / GRID_SIZE);
                                      const c = index % GRID_SIZE;
                                      const inPath = currentPath.some(pos => pos.r === r && pos.c === c);
                                      return (
                                          <button
                                              key={index}
                                              onClick={() => handleCellClick(r, c)}
                                              className={cn("w-14 h-14 sm:w-16 sm:h-16 text-2xl font-bold border-2 rounded-lg flex items-center justify-center transition-colors",
                                              inPath ? "bg-yellow-400 border-yellow-600 text-white" : "bg-card hover:bg-muted"
                                              )}
                                          >
                                              {letter}
                                          </button>
                                      );
                                  })}
                              </div>
                              <div className='text-center h-12 border rounded-lg flex items-center justify-center text-2xl font-mono tracking-widest bg-muted'>
                                  {currentWord || "..."}
                              </div>
                          </div>

                          <div className="flex md:flex-col gap-2 w-full md:w-auto md:flex-grow">
                              <Button className="w-full bg-accent text-accent-foreground" onClick={submitWord} disabled={currentWord.length === 0}>Submit</Button>
                              <Button variant="destructive" className="w-full" onClick={() => { setCurrentPath([]); setCurrentWord(''); }}>Clear</Button>
                              <Button variant="outline" className="w-full" onClick={() => loadNextWord(true)}>
                                  <SkipForward className="mr-2"/> Skip
                              </Button>
                          </div>
                      </div>
                  </>
              )}
          </CardContent>
      </Card>
    </div>
  );
}
