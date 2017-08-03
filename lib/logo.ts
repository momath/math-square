export const TAU = 2*Math.PI;

function MOD(a: number, d: number) {
  return (a % d + d) % d;
}

interface Path2D extends Object, CanvasPathMethods {
}
declare var Path2D: {
    prototype: Path2D;
    new(path?: Path2D|undefined): Path2D;
}/*|undefined*/

type Path = number[]

interface LogoParameters {
  size: number			/* scale of symbols, 0~1 */
  radius: number		/* symbol distance from center, 0~1 */
  rotation: number		/* symbol in-place rotation angle, 0-TAU radians */
  reflect: number		/* dihedral symmetry reflection, 1 (cyclic) or -1 (dihedral) */
  offset: number		/* dihedral symmetry rotation offset, 0-PI radians (for reflect = -1) */
  orientation: number           /* figure rotation, 0-PI radians */
  clockwise: number		/* layer symbols, 1 (clockwise) or -1 (counterclockwise) */
  symbol: string|Path|Path2D	/* actual single character symbol to render as font, or key in LogoParams.paths */
  font: string			/* font family/name: serif, sans-serif, etc. */
  style: string			/* font style/variant/weight: bold, italic, etc. */
  colors: string[]		/* colors to use for symbols */
  count: number			/* defaults to colors.length, should be even when dihedral */
}

type LogoShape = {
  a: number, /* angle */
  c: string, /* color */
  r: number /* reflect */
}

export class LogoParams implements LogoParameters, Object {
  /* available character symbols */
  static readonly symbols = (() => {
    let s = "";
    const r = function(a: number, b: number) {
      for (let i = a; i <= b; i++)
	s += String.fromCharCode(i);
    };
    /* XXX only UTF-16 characters will work correctly */
    r(0x21, 0x7e);
    r(0xa1, 0xa9);
    s += "\u00AB\u00AC\u00AE\u00B0\u00B1\u00B5\u00B6\u00B7\u00B8\u00BB";
    r(0xbf, 0x103);
    s += "\u0106\u0107\u010C\u010D\u0112\u0113\u0114\u0115\u012C\u012D\u0131\u0141\u0142\u0150\u0151\u0152\u0153\u0160\u0161\u0170\u0171\u0192\u02C7\u02D8";
    r(0x391, 0x3a1); // Alpha-Rho
    r(0x3a3, 0x3a9); // Sigma-Omega
    r(0x3b1, 0x3c9); // alpha-omega
    s += "\u03D1\u03D2\u03D5\u03D6\u03DA\u03DB\u03DC\u03DD\u03DE\u03DF\u03E0\u03E1\u03F0\u03F1\u03F5\u2010\u2013\u2014\u2015\u2018\u2019\u201C\u201D\u2020\u2021\u2022\u2026\u2028\u2029\u2032\u2033\u2035\u2036\u2043\u2062\u20AC\u2108";
    r(0x210a,0x211f);
    r(0x2122,0x2139);
    r(0x213c,0x2149);
    r(0x2190,0x2199);
    s += "\u21A4\u21A5\u21A6\u21A7\u21B5\u21BC\u21BD\u21BE\u21BF\u21C0\u21C1\u21C2\u21C3\u21C4\u21C5\u21C6\u21CB\u21CC\u21D0\u21D1\u21D2\u21D3\u21D4\u21D5\u21E4\u21E5\u21F5\u2200\u2202\u2203\u2204\u2205\u2207\u2208\u2209\u220B\u220C\u220D\u220F\u2210\u2211\u2212\u2213\u2215\u2216\u2218\u221A\u221D\u221E\u221F\u2220\u2221\u2222\u2223\u2225\u2226\u2227\u2228\u2229\u222B\u222E\u222F\u2232\u2233\u2234\u2235\u2236\u2237\u223C\u2240\u2241\u2242\u2243\u2244\u2245\u2247\u2248\u2249\u224D\u224E\u224F\u2250\u2254\u2260\u2261\u2262\u2264\u2265\u2266\u2267\u2268\u2269\u226A\u226B";
    r(0x226d,0x2289);
    r(0x228e,0x2297);
    s += "\u2299\u22A2\u22A3\u22A4\u22A5\u22A8\u22B2\u22B3\u22B4\u22B5\u22BB\u22BC\u22BD\u22C0\u22C1\u22C2\u22C3\u22C4\u22C6\u22DA\u22DB\u22E0\u22E1\u22E2\u22E3";
    r(0x22e8,0x22f1);
    s += "\u2300\u2308\u2309\u230A\u230B\u2318\u231A\u2322\u2323\u2329\u232A\u23B4\u23B5\u2423\u2460\u2461\u2462\u2463\u2464\u2465\u2466\u2467\u2468\u2469\u2500\u2502\u25A0\u25A1\u25AA\u25AB\u25AE\u25AF\u25B2\u25B3\u25B4\u25B6\u25B8\u25BC\u25BD\u25BE\u25C0\u25C2\u25C6\u25C7\u25CB\u25CF\u25E6\u25FB\u25FC\u2605\u2611\u2612\u2639\u263A";
    r(0x263e,0x2653);
    s += "\u2660\u2661\u2662\u2663\u2665\u2666\u2669\u266A\u266B\u266C\u266D\u266E\u266F\u2713\u2736";
    r(0x2776,0x2793);
    s += "\u27C2\u27F5\u27F6\u27F7\u27F8\u27F9\u27FA\u2912\u2913";
    r(0x294E,0x2961);
    s += "\u296E\u296F\u2970\u29CF\u29D0\u29E6\u2A7D\u2A7E\u2AA1\u2AA2\u2AAF\u2AB0\u2AE4\u3001\u3002";
    r(0x3008,0x3012);
    s += "\u3014\u3015\u301A\u301B\u309B\u309C\u309D\u309E\u30FC\u30FD\u30FE\uFB01\uFB02\uFE35\uFE36\uFE37\uFE38\uFF01\uFF08\uFF09\uFF0C\uFF0E\uFF1A\uFF1B\uFF1F\uFF20\uFF3B\uFF3D\uFF5B\uFF5D\uFFE5\uFFFD";
    // ...
    // r(0x1d49c, 0x1d4b5); // mathematical script capitals
    return s;
  })();
  /* standard momath colors */
  static readonly colors =
    [ '#8b0028'
    , '#d49912'
    , '#2b7434'
    , '#004785'
    ];
  /* selection of chars.json paths; can be fully populated with loadPaths */
  static paths: {readonly [name:string]: Path} = {
    "Pi":[-7.4604,-5.9235,-7.452,-5.7405,-7.3873,-5.3989,-7.3332,-5.2392,-7.1864,-4.939,-6.9951,-4.6606,-6.6426,-4.274,-6.2359,-3.9107,-5.3704,-3.1919,-4.9668,-2.8054,-4.6195,-2.3801,-4.4328,-2.0674,-4.356,-1.9006,-3.2882,1.4588,-2.2204,4.8182,-3.9936,4.8149,-4.3074,4.767,-4.6297,4.6675,-4.846,4.5759,-5.1675,4.4055,-5.4794,4.2016,-5.7749,3.971,-6.0471,3.7205,-6.2894,3.4568,-6.4949,3.1866,-6.6568,2.9169,-6.9736,2.9169,-6.9017,3.1558,-6.7525,3.4921,-6.5564,3.8396,-6.3284,4.1879,-5.96,4.6897,-5.4489,5.328,-4.9594,5.8339,-4.698,6.0611,-4.4249,6.2673,-4.1395,6.4497,-3.8413,6.6053,-3.5297,6.7313,-3.3143,6.7975,-2.9794,6.8678,-2.7479,6.8942,7.4604,6.9032,7.0287,4.8182,4.0023,4.8182,3.2675,1.7091,2.5327,-1.3999,2.4463,-1.8881,2.4181,-2.2336,2.4235,-2.4238,2.4662,-2.7104,2.5458,-2.9572,2.6561,-3.1715,2.7909,-3.3608,2.9441,-3.5324,3.4529,-4.0143,3.697,-4.2823,3.9065,-4.6015,4.0168,-4.855,4.0963,-5.1496,4.1227,-5.3146,4.1447,-5.6847,4.136,-5.8563,4.1107,-6.0131,4.0436,-6.2217,3.9445,-6.3995,3.8166,-6.5479,3.6633,-6.6686,3.4248,-6.7886,3.1547,-6.8653,2.8608,-6.9019,2.563,-6.9022,2.2912,-6.87,2.0411,-6.8075,1.706,-6.6613,1.5088,-6.5318,1.332,-6.379,1.1753,-6.205,0.9773,-5.9085,0.8694,-5.6902,0.7804,-5.4576,0.7099,-5.2127,0.6381,-4.827,0.606,-4.425,0.6201,-3.793,0.6751,-3.2213,0.7753,-2.5741,0.9207,-1.85,1.6555,1.484,2.3903,4.8182,-0.6911,4.8182,-1.9897,0.8582,-3.2883,-3.1018,-3.5391,-3.7746,-3.7292,-4.232,-3.9385,-4.6845,-4.1677,-5.1219,-4.5505,-5.7276,-4.833,-6.0829,-5.138,-6.3874,-5.2993,-6.5174,-5.6397,-6.7267,-6.0047,-6.8597,-6.1966,-6.8945,-6.5342,-6.9032,-6.7827,-6.8764,-6.9917,-6.8189,-7.1616,-6.7264,-7.2638,-6.6316,-7.3666,-6.468,-7.4189,-6.315,-7.4501,-6.1341],
    "Lambda":[-6.3415,-8.6699,-6.3763,-8.9161,-3.87,-8.9161,-3.9565,-8.3314,-3.974,-8.0987,-3.9662,-7.8048,-3.9037,-7.2465,-3.7844,-6.6551,-3.6143,-6.0373,-3.3993,-5.3997,-3.1455,-4.7492,-2.8587,-4.0923,-2.5449,-3.4358,-2.2101,-2.7863,-1.6815,-1.84,-1.3202,-1.2375,-0.7799,-0.3929,-0.4294,0.1207,0.0667,0.8006,0.1109,0.644,0.1618,-0.0723,0.1778,-2.1102,0.2202,-2.9989,0.3137,-3.9731,0.4719,-4.9853,0.6204,-5.6577,0.709,-5.9879,0.9177,-6.6274,1.0388,-6.9333,1.317,-7.5082,1.4752,-7.7739,1.6467,-8.0225,1.8322,-8.2525,2.0321,-8.4621,2.2469,-8.6494,2.4771,-8.8127,2.7234,-8.9503,2.9861,-9.0604,3.2658,-9.1412,3.5631,-9.191,3.8783,-9.208,4.1489,-9.1658,4.4552,-9.0481,4.893,-8.7967,5.2237,-8.5545,5.6392,-8.1855,5.9928,-7.7927,6.1958,-7.5014,6.3287,-7.2278,6.3763,-6.9852,6.3221,-6.9352,6.2354,-6.9515,6.1121,-7.0134,5.9915,-7.1105,5.5324,-7.5504,5.3544,-7.6755,5.2198,-7.7472,4.9897,-7.829,4.8148,-7.8618,4.6206,-7.8735,4.3655,-7.8557,4.1314,-7.8043,3.9175,-7.7222,3.7228,-7.6121,3.4643,-7.4009,3.3129,-7.2336,3.1149,-6.9498,3.0007,-6.743,2.8538,-6.4134,2.6653,-5.8364,2.5184,-5.1791,2.3912,-4.3872,2.2805,-3.3853,2.2238,-2.5771,2.1837,-1.5622,2.1625,0.9912,2.1293,2.0345,2.0403,3.1492,1.9409,3.9097,1.8032,4.6683,1.7182,5.0427,1.5127,5.7733,1.2551,6.4684,1.1052,6.7984,0.9402,7.1144,0.7594,7.4149,0.5623,7.698,0.3481,7.9622,0.1162,8.2057,-0.1341,8.4269,-0.4037,8.624,-0.693,8.7954,-1.0028,8.9395,-1.3338,9.0544,-1.6866,9.1386,-2.0619,9.1904,-2.4604,9.208,-2.7992,9.1877,-3.1698,9.1264,-3.5489,9.0234,-3.9126,8.8781,-4.1767,8.7308,-4.3512,8.602,-4.4997,8.4573,-4.2245,8.1612,-3.8211,8.3823,-3.4942,8.493,-3.12,8.5361,-2.8819,8.5285,-2.6998,8.505,-2.3631,8.4141,-2.2079,8.3483,-1.9223,8.1797,-1.668,7.9667,-1.5519,7.8454,-1.3404,7.5768,-1.1546,7.2786,-0.9193,6.7887,-0.7291,6.2654,-0.5767,5.7289,-0.4191,5.0272,-0.1673,3.6737,-0.1184,3.183,-0.1366,2.7987,-0.1946,2.4852,-0.2878,2.1475,-0.4138,1.7876,-0.5697,1.4075,-0.9608,0.5943,-1.4396,-0.2762,-1.9849,-1.1884,-2.575,-2.1264,-4.6849,-5.3855,-5.4495,-6.6526,-5.8591,-7.4148,-6.1636,-8.0924,-6.2697,-8.3947],
    "Psi":[-4.6379,-1.4364,-4.6606,-1.7551,-4.6615,-2.0475,-4.6294,-2.4176,-4.5866,-2.644,-4.5264,-2.8538,-4.4034,-3.1368,-4.2407,-3.381,-4.0381,-3.5854,-3.8806,-3.6992,-3.7051,-3.7947,-3.4077,-3.903,-3.0691,-3.9687,-2.6889,-3.9908,-2.2999,-2.3408,-1.9109,-0.6909,-1.1329,2.6088,-0.3549,5.9086,0.423,9.2084,2.2186,9.5152,1.2243,6.1438,0.23,2.7725,-0.7641,-0.5987,-1.2612,-2.2844,-1.7584,-3.9701,-1.3461,-3.94,-0.9427,-3.8554,-0.487,-3.6987,-0.0521,-3.4921,0.1852,-3.3566,0.4358,-3.1845,0.6613,-2.9801,0.8638,-2.746,1.0459,-2.4849,1.2098,-2.1995,1.3579,-1.8924,1.4926,-1.5662,1.6161,-1.2237,1.8393,-0.5002,2.3676,1.4091,2.6163,2.1572,2.7581,2.5173,2.9147,2.8646,3.0883,3.1963,3.2814,3.5099,3.4962,3.8027,3.7352,4.0719,4.0008,4.3151,4.2951,4.5294,4.6206,4.7124,4.9797,4.8612,5.3747,4.9732,5.8079,5.0458,6.2817,5.0763,6.2163,4.7937,6.0236,4.7602,5.7997,4.657,5.5576,4.4672,5.3465,4.2353,5.1423,3.9533,4.9381,3.6229,4.6691,3.095,4.4451,2.5455,4.2558,1.98,4.0909,1.4038,3.6401,-0.3334,3.3757,-1.1731,3.1613,-1.7097,3.0388,-1.9689,2.7569,-2.466,2.5949,-2.7024,2.4171,-2.9298,2.2223,-3.1475,2.0091,-3.3549,1.7763,-3.5512,1.5226,-3.7358,1.2467,-3.908,0.6347,-4.2247,-0.0027,-4.4895,-0.3295,-4.599,-0.6606,-4.6917,-0.9956,-4.766,-1.3337,-4.8207,-1.6743,-4.8546,-2.0168,-4.8661,-2.7199,-7.1906,-3.4229,-9.5152,-3.933,-9.5152,-3.4298,-7.1906,-3.1782,-6.0284,-2.9267,-4.8661,-3.1083,-4.8612,-3.4646,-4.8229,-3.6387,-4.7899,-3.9775,-4.6974,-4.1416,-4.6384,-4.458,-4.4959,-4.6096,-4.4129,-4.8985,-4.2245,-5.1663,-4.0079,-5.4109,-3.7648,-5.6301,-3.4972,-5.7294,-3.3547,-5.9062,-3.0537,-5.9832,-2.8955,-6.1127,-2.5652,-6.1647,-2.3935,-6.242,-2.0381,-6.2817,-1.6682,-6.2741,-1.1395,-6.213,-0.6388,-6.1494,-0.3092,-6.0286,0.1802,-5.5943,1.6329,-5.4655,2.1186,-5.3392,2.7729,-5.2941,3.2713,-5.2924,3.648,-5.3083,3.9392,-5.3435,4.1759,-5.3891,4.3446,-5.4828,4.5445,-5.5828,4.6663,-5.6658,4.7303,-5.7631,4.778,-5.9387,4.8144,-5.8732,5.0763,-5.4879,5.0595,-5.1373,5.0073,-4.8227,4.9173,-4.5456,4.7871,-4.3073,4.6141,-4.1093,4.396,-3.9528,4.1302,-3.8723,3.9253,-3.7882,3.5746,-3.7495,3.1698,-3.7586,2.6481,-3.7914,2.2855,-3.8733,1.7609,-3.9845,1.2557,-4.4259,-0.3401,-4.5683,-0.9644],
    "ScriptCapitalB":[-7.214,-7.2051,-7.3298,-7.2889,-7.4384,-7.3877,-7.6361,-7.2854,-7.5568,-7.0233,-7.4689,-6.8017,-7.3354,-6.5328,-7.1998,-6.3066,-7.0408,-6.0792,-6.8087,-5.7881,-6.6439,-5.6087,-6.4406,-5.4261,-6.3198,-5.3384,-6.1598,-5.2468,-6.0008,-5.1837,-5.8423,-5.1489,-5.7236,-5.1411,-5.634,-5.1495,-5.1305,-5.2536,-4.9038,-5.2256,-4.735,-5.1677,-4.5113,-5.041,-4.2889,-4.8578,-4.0674,-4.6176,-3.7912,-4.2369,-3.5153,-3.7665,-3.2161,-3.1582,-2.9759,-2.5899,-2.7584,-1.9628,-2.6718,-1.6573,-2.584,-1.2822,-2.0351,1.6188,-1.8891,2.2623,-1.7773,2.6652,-1.6214,3.1396,-1.4475,3.5814,-1.2559,3.9903,-0.9772,4.4773,-0.6783,4.9091,-0.3449,5.3219,0.0221,5.716,0.4223,6.0914,0.8549,6.448,1.3192,6.786,1.6311,6.9841,1.9431,7.1823,1.5361,7.1732,1.1396,7.1457,0.7536,7.0999,0.3779,7.0356,0.0127,6.9526,-0.3419,6.8509,-0.6863,6.7304,-1.0202,6.591,-1.3437,6.4326,-1.6567,6.255,-1.9693,6.0523,-2.2647,5.8327,-2.543,5.596,-2.8042,5.3421,-3.0484,5.0708,-3.2018,4.8803,-3.4178,4.5798,-3.6168,4.2616,-3.799,3.9256,-3.9644,3.5715,-4.1043,3.2174,-4.2119,2.8734,-4.2901,2.5347,-4.3398,2.2013,-4.362,1.8734,-4.3563,1.5306,-4.3244,1.2321,-4.267,0.9506,-4.1593,0.6238,-4.0115,0.3259,-3.8235,0.0582,-3.6442,-0.1333,-3.7089,-0.1333,-3.7564,-0.1565,-3.9507,-0.1494,-4.1779,-0.1152,-4.3452,-0.0717,-4.5639,0.0096,-4.7248,0.088,-4.935,0.2154,-5.0893,0.3279,-5.2908,0.5004,-5.4362,0.6457,-5.6074,0.8469,-5.7539,1.0529,-5.8755,1.2634,-5.972,1.4785,-6.0277,1.6428,-6.0795,1.8658,-6.1015,2.0359,-6.1089,2.2086,-6.0953,2.5359,-6.0239,3.012,-5.8914,3.4703,-5.6977,3.9108,-5.4429,4.3338,-5.1269,4.7392,-4.7498,5.1272,-4.3115,5.4978,-3.9853,5.7354,-3.4451,6.0774,-3.051,6.2959,-2.5362,6.5534,-2.0185,6.7839,-1.4977,6.9874,-0.9733,7.1638,-0.6217,7.2663,-0.091,7.3976,0.4438,7.5017,0.983,7.5787,1.3452,7.6149,1.8924,7.6467,2.2601,7.6527,3.2796,7.6224,3.9,7.5686,4.4729,7.4879,4.9984,7.3804,5.2432,7.3165,5.6973,7.1686,6.1038,6.9938,6.4625,6.7922,6.6241,6.6813,6.9113,6.4393,7.1507,6.1706,7.3424,5.8749,7.4203,5.7171,7.5401,5.3812,7.5821,5.2032,7.6301,4.8271,7.6361,4.6289,7.6068,4.296,7.5464,4.0479,7.4531,3.8013,7.3269,3.5564,7.1677,3.3132,6.9756,3.0719,6.7506,2.8326,6.4927,2.5954,6.2018,2.3605,5.8155,2.0872,5.3731,1.8097,4.9195,1.5572,4.4541,1.3297,4.0728,1.1657,3.5844,0.9832,3.1839,0.8552,3.9483,0.7195,4.6318,0.5498,5.2345,0.3461,5.7565,0.1087,6.1979,-0.1623,6.3272,-0.2601,6.5588,-0.4669,6.6613,-0.5759,6.8394,-0.805,6.9818,-1.0489,7.0886,-1.3075,7.1286,-1.4424,7.182,-1.7231,7.1997,-2.0185,7.1892,-2.3014,7.1577,-2.5803,7.1052,-2.8552,7.0317,-3.1261,6.882,-3.5251,6.7558,-3.7862,6.6087,-4.0434,6.4405,-4.2969,6.2513,-4.5465,6.041,-4.7924,5.8096,-5.0346,5.5572,-5.2731,5.139,-5.6241,4.6956,-5.9511,4.138,-6.3148,3.5725,-6.6359,2.9987,-6.9141,2.4157,-7.149,1.823,-7.3402,1.2197,-7.4875,0.6054,-7.5905,0.1244,-7.6361,-0.5806,-7.6527,-1.4129,-7.6472,-2.0809,-7.6064,-3.1465,-7.4852,-5.4733,-7.1102,-6.0431,-7.0327,-6.398,-7.0004,-6.681,-7.0139,-6.9612,-7.0813,-7.0911,-7.136,-7.214,-7.2051,3.5708,-0.2759,3.2708,-0.1061,2.9352,0.037,2.5918,0.1436,2.0994,0.2517,1.6546,0.3184,1.0346,0.3777,0.487,0.4062,-0.2624,0.4188,-0.3943,-0.2331,-0.5336,-0.8309,-0.6806,-1.3747,-0.7959,-1.7471,-0.9568,-2.1963,-1.1258,-2.5916,-1.3033,-2.933,-1.442,-3.1537,-1.605,-3.3728,-1.8681,-3.6689,-2.1829,-3.9693,-2.5486,-4.2735,-2.856,-4.5041,-3.3094,-4.8146,-3.8121,-5.1281,-4.3635,-5.4445,-3.54,-5.7172,-2.6958,-5.9415,-1.8314,-6.117,-0.9471,-6.243,-0.0434,-6.319,0.508,-6.3404,0.983,-6.3434,1.2884,-6.3272,1.5861,-6.2913,2.0648,-6.1875,2.3415,-6.0986,2.6104,-5.9896,2.8713,-5.8603,3.1244,-5.7105,3.3695,-5.5401,3.6857,-5.2817,3.9064,-5.0725,4.1022,-4.853,4.2192,-4.7008,4.3742,-4.4638,4.5049,-4.2164,4.6115,-3.9586,4.6941,-3.6904,4.753,-3.4117,4.7881,-3.1226,4.7998,-2.823,4.7834,-2.4276,4.7344,-2.0593,4.6525,-1.7178,4.5798,-1.505,4.4925,-1.3038,4.3344,-1.0238,4.1435,-0.7697,3.9198,-0.5413,3.7526,-0.403,3.5708,-0.2759,-7.214,-7.2051,2.9792,1.3847,3.3735,1.5483,3.8453,1.8009,4.3019,2.1131,4.6514,2.4124,4.9502,2.7332,5.198,3.0761,5.3501,3.348,5.4354,3.5365,5.5668,3.9311,5.646,4.3496,5.6725,4.7926,5.6541,5.0469,5.5986,5.2918,5.5057,5.5273,5.3751,5.7533,5.2064,5.9698,5.0546,6.126,4.8184,6.326,4.5529,6.51,4.2346,6.6896,3.9103,6.8342,3.5803,6.9442,3.2454,7.0202,2.906,7.0628,2.569,7.0704,2.3808,7.0285,2.1927,6.9365,2.0673,6.8473,1.8792,6.672,1.7539,6.5274,1.566,6.269,1.4408,6.0693,1.2531,5.7283,1.0655,5.3379,0.8782,4.8982,0.7533,4.5778,0.5392,3.956,0.2169,2.8962,-0.0007,2.0137,-0.1534,1.1824,0.5079,1.1036,1.0404,1.0739,1.5847,1.0906,2.033,1.1424,2.464,1.2286,2.9792,1.3847],
    "LowerZ":[-6.5672,-6.2281,-6.1986,-6.3663,-5.7722,-6.1707,-5.4437,-6.049,-5.194,-5.9947,-4.8925,-5.9676,-4.2557,-5.9912,-3.9206,-6.0448,-3.6304,-6.1152,-3.1106,-6.2967,-2.4191,-6.614,0.2621,-8.0679,0.8526,-8.3598,1.2376,-8.517,1.5447,-8.6112,1.9063,-8.6947,2.2716,-8.7496,2.7467,-8.7784,3.2564,-8.7563,3.6894,-8.689,4.1777,-8.5491,4.5587,-8.3832,4.9848,-8.1248,5.3114,-7.8633,5.638,-7.5337,5.8863,-7.1958,6.0562,-6.8499,6.1477,-6.4958,6.1619,-6.1396,6.1045,-5.783,5.9587,-5.4424,5.7505,-5.183,5.499,-5.0164,5.2972,-4.9441,5.0681,-4.9028,4.8252,-4.8923,4.5834,-4.9167,4.3532,-4.9801,4.1613,-5.0676,3.9787,-5.1849,3.8258,-5.3299,3.715,-5.5014,3.646,-5.6993,3.6186,-5.9579,3.6424,-6.1932,3.7024,-6.4058,3.7988,-6.6247,4.2586,-7.3909,4.2887,-7.4992,4.268,-7.628,4.2059,-7.7464,4.1025,-7.8544,3.9378,-7.9627,3.7622,-8.0364,3.5634,-8.0844,3.3414,-8.1068,2.8896,-8.0763,2.5432,-7.9793,2.249,-7.8388,1.9351,-7.6263,1.6182,-7.3592,1.2584,-6.9705,-0.0998,-5.231,-0.5184,-4.801,-0.9645,-4.4273,-1.4382,-4.1099,-1.9884,-3.83,-2.632,-3.6035,-3.4218,-3.4052,-2.1731,-1.9325,-0.9245,-0.4598,1.5726,2.4855,4.0699,5.431,6.5672,8.3764,6.5672,8.7784,-3.2207,8.7784,-4.2217,4.7577,-3.6856,4.6237,-3.4851,5.1051,-3.2772,5.5176,-3.0619,5.861,-2.8769,6.0945,-2.6867,6.2801,-2.4433,6.4472,-2.1564,6.5782,-1.824,6.675,-1.446,6.7377,-0.9474,6.7676,4.45,6.7681,3.0728,5.1435,1.6957,3.519,0.3185,1.8945,-1.0585,0.2699,-2.4357,-1.3545,-3.8129,-2.979],
    "Plus":[-0.9683,1.28,-9.6231,1.28,-9.6231,-0.929,-0.9683,-0.929,-0.9683,-9.953,0.9683,-9.953,0.9683,-0.929,9.6231,-0.929,9.6231,1.28,0.9683,1.28,0.9683,9.953,-0.9683,9.953],
    "Sqrt":[-6.1773,-0.2131,-5.9656,-0.5815,-4.082,0.1223,-1.7681,-4.7365,0.5458,-9.5953,6.1773,9.5953,5.1379,9.5953,2.8941,1.9138,0.6503,-5.7676,-1.0737,-2.0898,-2.7979,1.588],
    "Parens":[-2.8217,-1.0046,-2.8591,-0.0939,-2.86,0.6927,-2.8307,1.3187,-2.7304,2.2487,-2.6254,2.8602,-2.4093,3.7602,-2.2254,4.3463,-2.009,4.9192,-1.8885,5.2002,-1.6225,5.75,-1.3228,6.2822,-1.1601,6.5412,-0.8089,7.0439,-0.4226,7.5246,-0.0007,7.9817,0.4571,8.4133,0.9396,8.8147,1.4929,9.2353,2.5519,9.9999,2.8155,9.5953,2.2577,9.1351,1.7531,8.6424,1.2993,8.1196,0.8943,7.569,0.5358,6.993,0.2218,6.394,-0.0499,5.7743,-0.2817,5.1363,-0.4754,4.4824,-0.6335,3.8149,-0.7579,3.1361,-0.851,2.4486,-0.9147,1.7545,-0.9514,1.0563,-0.9632,0.3563,-0.9558,-0.3854,-0.9109,-1.5064,-0.8523,-2.2537,-0.7659,-2.9967,-0.6476,-3.7314,-0.4933,-4.4541,-0.2987,-5.161,-0.0598,-5.8482,0.0774,-6.1832,0.3906,-6.8338,0.5675,-7.1484,0.9643,-7.7538,1.1853,-8.0437,1.422,-8.3243,1.675,-8.5953,1.9448,-8.8562,2.2319,-9.1064,2.5368,-9.3455,2.86,-9.5731,2.5779,-9.9999,1.7966,-9.4752,1.0856,-8.9372,0.4426,-8.3836,-0.1347,-7.8117,-0.6492,-7.2193,-0.8835,-6.9146,-1.3079,-6.2866,-1.6754,-5.6319,-1.9884,-4.948,-2.2493,-4.2324,-2.4607,-3.4828,-2.6249,-2.6965,-2.7444,-1.8713],
  };
  private static pathsLoaded: string|undefined

  public static loadPaths(done: () => void = () => {}, url: string = 'chars.json') {
    if (this.pathsLoaded === url)
      return done();
    let req = new XMLHttpRequest();
    req.addEventListener("loadend", () => {
      if (req.readyState != 4 || req.status != 200)
	return;
      this.paths = JSON.parse(req.responseText);
      this.pathsLoaded = url;
      return done();
    });
    req.open('GET', url);
    req.send();
  }

  /* parameter presets from current web pages */
  static readonly presets: {readonly [name:string]: LogoParameters} = {
    'home':       new LogoParams( 44, null, false, 46, 48, 151, 'Pi',		  [0,1,2,3]),
    'about':      new LogoParams( 72, null, false, 54, 61, 296, 'Lambda',	  [2,3,0,1]),
    'contact':	  new LogoParams(114, null,  true, 56, 56, 315, '\u2254',	  [1,0,3,2]), /* can't find this symbol in MOMATHOutlines? */
    'contribute': new LogoParams(151, null, false, 62, 25, 197, 'Sqrt',		  [3,1,0,2]),
    'gallery':	  new LogoParams(  0, null, false, 43, 49, 294, 'LowerZ',	  [3,0,1,2]),
    'jobs':	  new LogoParams( 39, null, false, 38, 57, 105, 'ScriptCapitalB', [0,2,3,1]),
    'join':	  new LogoParams( 47, null, false, 45, 45, 207, 'Lambda',	  [2,3,0,1]),
    'press':	  new LogoParams( 15, null, false, 81,  0,   0, 'Parens',	  [0,1,2,3]),
    'shop':	  new LogoParams(164, null, false, 42, 57, 294, 'Plus',		  [2,3,0,1]),
    'visit':	  new LogoParams( 78, null, false, 49, 57, 275, 'Psi',		  [3,0,1,2]),
  };

  size: number
  radius: number
  rotation: number
  reflect: number
  offset: number
  orientation: number
  clockwise: number
  font: string
  style: string
  colors: string[]
  count: number

  private sym: string|Path|Path2D
  private path: undefined|string|Path|Path2D = undefined

  get symbol(): string|Path|Path2D {
    return this.sym;
  }
  set symbol(sym: string|Path|Path2D) {
    this.sym = sym;
    this.path = undefined;
  }

  public setSymbol(sym: number|string|Path|Path2D) {
    if (typeof sym === 'number') {
      const paths = Object.keys(LogoParams.paths);
      sym = MOD(sym, LogoParams.symbols.length+paths.length);
      sym = sym < paths.length ? paths[sym] : LogoParams.symbols[sym - paths.length];
    }
    this.symbol = sym;
  }

  get dihedral(): number|null {
    return this.reflect < 0 ? this.offset : null;
  }
  set dihedral(d: number|null) {
    this.reflect = d == null ? 1 : -1;
    this.offset = MOD(d || 0, Math.PI);
  }

  constructor(params: LogoParameters, params2?: LogoParameters, interpolate?: number)
  constructor(preset?: string)		    /* key in LogoParams.presets ["home"] */
  constructor(orientation: number,          /* figure rotation, degrees */
	      dihedral?: number|null,	    /* dihedral symmetry rotation offset, degrees [0] */
	      clockwise?: boolean,	    /* layer symbols clockwise vs. counterclockwise [false] */
	      size?: number,		    /* scale of symbols, 0~100 [50] */
	      radius?: number,		    /* symbol distance from center, 0~100 [50] */
	      rotation?: number,	    /* symbol in-place rotation angle, degrees [0] */
	      symbol?: string|Path|Path2D,  /* actual single character symbol to render as font, or key in LogoParams.paths ["Pi"] */
	      colors?: (number|string)[],   /* colors to use for symbols or indices into LogoParams.colors, should be even when dihedral [0,1,2,3] */
	      font?: string,		    /* font family/name: serif, sans-serif, etc. ["sans-serif"] */
	      style?: string,		    /* font style/variant/weight: bold, italic, etc. ["normal"] */
	      count?: number)
  constructor(arg: string|number|LogoParameters = 'home',
	      arg2?: number|null|LogoParameters,
	      arg3?: boolean|number,
	      size: number = 50,
	      radius: number = 50,
	      rotation?: number,
	      symbol?: string|Path|Path2D,
	      colors: (number|string)[] = [0,1,2,3],
	      font?: string,
	      style?: string,
	      count?: number) {
    if (arg === 'rand')
      return this.randomize();
    if (typeof arg === 'string')
      arg = LogoParams.presets[arg];
    if (!arg || typeof arg === 'number') {
      const rad = (d: number) => d/360*TAU;
      this.size = size / 100;
      this.radius = radius / 100;
      this.rotation = MOD(rad(rotation || 0), TAU);
      this.dihedral = <number|null>arg2 && rad(<number>arg2);
      this.orientation = MOD(rad(<number|undefined>arg || 0), Math.PI);
      this.clockwise = arg3 ? 1 : -1;
      this.symbol = symbol || 'Pi';
      this.font = font || 'sans-serif';
      this.style = style || 'normal';
      this.colors = colors.map((c) => typeof c === 'string' ? c : LogoParams.colors[c]);
      this.count = count || this.colors.length;
    } else {
      arg2 = <LogoParameters>arg2 || arg;
      const t = 1-(<number>arg3||0);
      const interp = (a: number, b: number, m: number) => {
	if (a - b > m/2)
	  b += m;
	else if (b - a > m/2)
	  a += m;
	return (t*a + (1-t)*b) % m;
      };
      let size2 = arg2.size;
      if (arg.symbol !== arg2.symbol || arg.font !== arg2.font || arg.style !== arg2.style)
	size2 = -size2;
      this.size        = t*arg.size      + (1-t)*size2;
      if (this.size >= 0) {
	this.symbol = arg.symbol;
	this.font   = arg.font;
	this.style  = arg.style;
      } else {
	this.size = -this.size;
	this.symbol = arg2.symbol;
	this.font   = arg2.font;
	this.style  = arg2.style;
      }
      this.radius      = t*arg.radius    + (1-t)*arg2.radius;
      this.rotation    = interp(arg.rotation,    arg2.rotation, TAU);
      this.reflect     = t*arg.reflect   + (1-t)*arg2.reflect;
      this.offset      = interp(arg.offset,      arg2.offset, Math.PI);
      this.orientation = interp(arg.orientation, arg2.orientation, Math.PI);
      this.clockwise   = t*arg.clockwise + (1-t)*arg2.clockwise;
      this.colors      = t >= 0.5 ? arg.colors : arg2.colors;
      this.count       = t*arg.count     + (1-t)*arg2.count;
    }
  }

  public randomSymbol() {
    const paths = Object.keys(LogoParams.paths);
    const sym = Math.floor((LogoParams.symbols.length+paths.length)*Math.random());
    this.symbol = sym < paths.length ? paths[sym] : LogoParams.symbols[sym - paths.length];
  }

  public randomize(): this {
    this.size = 0.2+0.4*Math.random();
    this.radius = Math.random();
    this.rotation = TAU*Math.random();
    const d = TAU*Math.random();
    this.dihedral = d >= Math.PI ? null : d;
    this.orientation = Math.PI*Math.random();
    this.clockwise = (Math.random() >= 0.5) ? 1 : -1;
    this.randomSymbol();
    this.colors = LogoParams.colors.slice().sort(() => Math.random() - 0.5);
    this.count = this.colors.length;
    this.font = this.font || 'sans-serif';
    this.style = this.style || 'normal';
    return this;
  }

  private nextSymbolChange = 0
  public animate(t: number): this {
    /* These weird functions are based on the MOMATHLogo autorun implementation */
    const weird = (a: number, b: number, c: number): number =>
      0.5 + (Math.sin(Math.PI/a*(t%(2*a))) + Math.sin(Math.E/b*(t%(TAU*b/Math.E))) + Math.sin(Math.SQRT2/c*(t%(TAU*c/Math.SQRT2))))/6;
    this.size = 0.2 + 0.4*weird(11003, 7001, 5003);
    this.radius = weird(3001, 5009, 7013);
    this.rotation = (t/4001 + 0.2*weird(991, 1009, 1019)) % TAU;
    this.offset = Math.PI/2*(weird(7013, 11027, 9001)-0.5);
    const d = t % 74017;
    if (d < 1000) {
      this.reflect = -Math.cos(Math.PI*d/1000);
      this.offset *= (1000-d)/1000;
    } else if (d <= 40000) {
      this.reflect = 1;
      this.offset = 0;
    } else if (d < 41000) {
      this.reflect = Math.cos(Math.PI*(d-40000)/1000);
      this.offset *= (d-40000)/1000;
    } else
      this.reflect = -1;
    this.offset = (this.offset + Math.PI) % Math.PI;
    this.orientation = (t/16001 + 0.2*weird(4019, 4003, 3989)) % Math.PI;
    const s = t % 23003;
    if (s < 1000) {
      this.size *= Math.abs(Math.cos(Math.PI*s/1000));
      if (s >= 500 && t > this.nextSymbolChange) {
	this.randomSymbol();
	this.nextSymbolChange = t + 1000;
      }
    }
    this.colors = LogoParams.colors;
    this.count = this.colors.length;
    return this;
  }

  public nextSymbol() {
    let sym = this.symbol;
    if (typeof sym === "string") {
      const paths = Object.keys(LogoParams.paths);
      if (sym in LogoParams.paths) {
	const i = (paths.indexOf(sym)+1) % paths.length;
	sym = i ? paths[i] : LogoParams.symbols[i];
      } else {
	const i = (LogoParams.symbols.indexOf(sym)+1) % LogoParams.symbols.length;
	sym = i ? LogoParams.symbols[i] : paths[i];
      }
    } else
      sym = 'Pi';
    this.symbol = sym;
  }

  public adjustScale(d: number) {
    const s = this.size;
    this.size = Math.max(0, Math.min(1, s + d))
    if (s > 0)
      this.radius *= this.size / s;
    else
      this.radius = this.size;
  }

  public adjustRadius(d: number) {
    this.radius = Math.max(0, Math.min(1, this.radius + d));
  }

  public adjustRotation(d: number) {
    this.rotation = MOD(this.rotation + d, TAU);
  }

  public adjustOrientation(d: number) {
    if (this.clockwise > 0)
      d = -d;
    this.orientation = MOD(this.orientation + d, Math.PI);
  }

  public adjustDihedral(d: number) {
    if (this.reflect > 0)
      return;
    this.offset = MOD(this.offset - d, Math.PI);
  }

  public toggleClockwise() {
    this.clockwise = -this.clockwise;
    this.orientation = Math.PI-this.orientation;
  }

  public toggleCount() {
    const t = this.colors.length;
    const n = this.count;
    if (n % 2 || this.reflect < 0) {
      this.count = (n % t)+1;
      this.reflect = 1;
    } else
      this.reflect = -1;
    this.offset = 0;
  }

  private static drawPath(ctx: CanvasPathMethods, path: Path) {
    ctx.moveTo(path[0], path[1]);
    for (let i = 2; i < path.length; i++)
      ctx.lineTo(path[i], path[++i]);
    ctx.closePath();
  }

  private getPath(): string|Path|Path2D {
    if (this.path)
      return this.path;
    let sym = this.sym;
    if (typeof sym === 'string' && sym in LogoParams.paths)
      sym = LogoParams.paths[sym];
    if (Array.isArray(sym) && (<any>window).Path2D) {
      const path = new Path2D();
      LogoParams.drawPath(path, sym);
      sym = path;
    }
    return this.path = sym;
  }

  public shapes(): LogoShape[] {
    /* find symbol positions, colors, flips */
    const n = this.count;
    let d = [];
    /* add symbols */
    for (let i = 0; i < n; i++) {
      let a = this.orientation + Math.PI*i/n;
      const o = (i & 1) == 1;
      d.push({a: (a + (o ? this.offset : 0)) % Math.PI, c: this.colors[i], r: o ? this.reflect : 1});
    }

    /* sort by angle, 0..pi */
    d.sort((x,y) => x.a - y.a);

    /* Duplicate copies at +pi to simplify processing */
    for (let i = 0; i < n; i++) {
      const s: LogoShape = Object.create(d[i]);
      s.a = s.a + Math.PI;
      d.push(s);
    }

    return d;
  }

  /* Draw a single symbol at orientation 0 */
  public draw(ctx: CanvasRenderingContext2D, shape: LogoShape) {
    ctx.rotate(this.clockwise*shape.a);
    ctx.translate(0, -this.radius);
    ctx.scale(shape.r*0.1*this.size, 0.1*this.size);
    ctx.rotate(this.rotation);
    const path = this.getPath();
    if (typeof path === "string") {
      ctx.fillText(path, 0, 0);
    } else {
      ctx.scale(1.2, -1.2);
      if (Array.isArray(path)) {
	ctx.beginPath();
	LogoParams.drawPath(ctx, path);
	ctx.fill('evenodd');
      } else {
	(<any>ctx).fill(path, 'evenodd');
      }
    }
  }
}

/* undefined return means stop animating */
type LogoAnimator = (t: number) => LogoParams|undefined

export class LogoCanvas implements EventListenerObject {
  public params: LogoParams
  private w: number
  private h: number
  private context: CanvasRenderingContext2D
  private bufferCanvas: HTMLCanvasElement
  private bufferContext: CanvasRenderingContext2D
  public onChange: undefined | (() => void)
  private mouseLast: undefined | MouseEvent
  private mouseMoved: boolean = false
  private mouseAdjustX: undefined | ((x: number) => void)
  private mouseAdjustY: undefined | ((y: number) => void)

  constructor(private canvas: HTMLCanvasElement,
	      params?: LogoParameters|string,
	      interactive: boolean = false) {
    this.params = new LogoParams(<any>params);

    let ctx = this.canvas.getContext('2d');
    if (!ctx)
      throw("Could not get 2d rendering context for canvas");
    this.context = ctx;

    this.bufferCanvas = document.createElement('canvas');
    this.w = (this.bufferCanvas.width = this.canvas.width)/2;
    this.h = (this.bufferCanvas.height = this.canvas.height)/2;

    ctx = this.bufferCanvas.getContext('2d');
    if (!ctx)
      throw("Could not get 2d rendering context for buffer");
    this.bufferContext = ctx;

    /* if text metrics worked more broadly, should prefer them for finding middle */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (interactive) {
      this.canvas.addEventListener('mousedown', this);
      this.canvas.addEventListener('dblclick', this);
    }

    this.draw();
  }

  handleEvent(ev: Event) {
    if (ev instanceof MouseEvent) {
      if (!this.animation) switch (ev.type) {
	case 'dblclick':
	  this.randomize();
	  return;
	case 'mousedown':
	  const x = ev.clientX-this.canvas.offsetLeft;
	  const y = ev.clientY-this.canvas.offsetTop;
	  this.mouseLast = ev;
	  this.mouseMoved = false;
	  this.mouseAdjustX = (
	    y < this.h ?
	      this.params.adjustRotation :
	      this.params.adjustOrientation
	    ).bind(this.params);
	  this.mouseAdjustY = (
	    x < this.w/1.5 ?
	      this.params.adjustDihedral : 
	    x < 2*this.w/1.5 ?
	      this.params.adjustRadius :
	      this.params.adjustScale
	    ).bind(this.params);
	  document.addEventListener('mousemove', this);
	  document.addEventListener('mouseup', this);
	  document.addEventListener('mouseleave', this);
	  return;
	case 'mouseleave':
	case 'mouseup':
	  document.removeEventListener('mousemove', this);
	  document.removeEventListener('mouseup', this);
	  document.removeEventListener('mouseleave', this);
	case 'mousemove':
	  if (!this.mouseLast)
	    return;
	  let dx = ev.clientX - this.mouseLast.clientX;
	  let dy = ev.clientY - this.mouseLast.clientY;
	  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
	    if (ev.type != 'mouseup' || this.mouseMoved)
	      return;
	    /* click */
	    dx = ev.clientX-this.canvas.offsetLeft - this.w;
	    dy = ev.clientY-this.canvas.offsetLeft - this.h;
	    const r2 = dx*dx/(this.w*this.w) + dy*dy/(this.h*this.h);
	    if (r2 < 0.05)
	      this.params.toggleClockwise();
	    else if (r2 < 0.95)
	      this.params.nextSymbol();
	    else
	      this.params.toggleCount();
	  } else {
	    /* motion */
	    this.mouseMoved = true;
	    if (this.mouseAdjustX)
	      this.mouseAdjustX(dx / this.w);
	    if (this.mouseAdjustY)
	      this.mouseAdjustY(dy / (-2*this.h));
	    this.mouseLast = ev;
	  }
	  break;
      }
      this.animate(false);
      this.change();
    }
  }

  private change() {
    this.draw();
    if (this.onChange)
      this.onChange();
  }

  private randomize() {
    this.animate(false);
    this.params.randomize();
    this.change();
  }

  private animation: number = 0
  public animate(enable: boolean): void /* off or forever */
  public animate(params: LogoParameters, dur?: number, done?: () => void): void /* animate to params over dur */
  public animate(params: LogoAnimator): void
  public animate(params?: boolean|LogoAnimator|LogoParameters, dur: number = 1000, done?: () => void) {
    if (this.animation) {
      cancelAnimationFrame(this.animation);
      this.animation = 0;
    }
    if (!params)
      return;
    const t0 = performance.now();
    if (params === true)
      params = (t: number) => this.params.animate(t0+t);
    else if (typeof params !== 'function') {
      const p1 = new LogoParams(params);
      if (!dur) {
	this.params = p1;
	this.change();
	return;
      }
      const p0 = this.params;
      let stop = false;
      params = (t: number) => {
	if (t >= <number>dur) {
	  if (stop) {
	    if (done)
	      done();
	    return;
	  }
	  stop = true;
	  return p1;
	}
	return new LogoParams(p0, p1, (1 - Math.cos(Math.PI*t/<number>dur))/2);
      };
    }
    const frame = (t: number) => {
      const p = (<LogoAnimator>params)(t-t0);
      if (p) {
        this.params = p;
        this.change();
        this.animation = requestAnimationFrame(frame);
      }
    };
    frame(t0);
  }

  public draw() {
    const params = this.params;
    const d = params.shapes();
    const n = d.length;

    /* prepare drawing contexts */
    const cw = this.w;
    const ch = this.h;
    this.context.clearRect(0,0,2*cw,2*ch);
    const ctx = this.bufferContext;
    /* use coordinates (-1,-1)-(1,1) */
    ctx.font = params.style + ' 28px ' + params.font;
    const w = params.clockwise;

    for (let i = 0; i < n; i++) {
      /* for each shape, draw the shape, and subtract the next n-1 */
      ctx.setTransform(cw, 0, 0, ch, cw, ch);
      ctx.clearRect(-1,-1,2,2);

      /* add */
      ctx.fillStyle = d[i].c;
      ctx.globalCompositeOperation = 'copy';
      params.draw(ctx, d[i]);

      /* subtract */
      ctx.fillStyle = '#000000';
      ctx.globalCompositeOperation = 'destination-out';
      for (let j = 1; j < params.count; j++) {
	ctx.setTransform(cw, 0, 0, ch, cw, ch);
	params.draw(ctx, d[(i+j)%n]);
      }

      /* add the result to the main canvas */
      this.context.drawImage(this.bufferCanvas, 0, 0);
    }
  }
}
