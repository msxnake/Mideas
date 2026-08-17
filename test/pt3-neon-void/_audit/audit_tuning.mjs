import { cargar, leerCabecera, leerPosiciones, decodificarCanal, u16 } from './pt3_decode_independent.mjs';
// T_NEW_2 = T1_+74 -> entradas 37..48 = primer grupo de T_PACK (valores *2 en T1_)
const BASE2 = [0x0D10,0x0C55,0x0BA4,0x0AFC,0x0A5F,0x09CA,0x093D,0x08B8,0x083B,0x07C5,0x0755,0x06EC];
// El constructor halla cada octava dividiendo por 2 CON REDONDEO (ADC A,D toma
// el carry de RR C), porque para la tabla 2 NT_DATA no lleva el +1 (=> NOP).
const NT = [];
for (let n = 0; n < 12; n += 1) { let v = BASE2[n] * 2; for (let o = 0; o < 8; o += 1) { v = (v >> 1) + (v & 1); NT[o * 12 + n] = v; } }
const RELOJ = 3579545 / 2;
const cents = (i) => 1200 * Math.log2((RELOJ / (16 * NT[i])) / (440 * Math.pow(2, (i + 24 - 69) / 12)));
console.log('nota  periodo   Hz      cents vs A440');
for (const i of [0,12,24,36,40,48,52,60,64,68,72]) console.log(`  ${String(i).padStart(2)}  ${String(NT[i]).padStart(5)}  ${(RELOJ/(16*NT[i])).toFixed(2).padStart(8)}  ${cents(i)>=0?'+':''}${cents(i).toFixed(1)}`);
for (const ruta of ['test/pt3-neon-void/neon_void_runner.pt3','test/pt3-neon-void/neon_void_runner_loop.pt3']) {
  const b = cargar(ruta), h = leerCabecera(b), { lista } = leerPosiciones(b);
  const uso = new Map();
  for (const p of lista) { const e = h.ptrPatrones + p*2;
    for (const [k,c] of ['A','B','C'].entries()) for (const f of decodificarCanal(b, u16(b,e+k*2)).filas)
      if (f.note !== null) uso.set(`${c}:${f.note}`, (uso.get(`${c}:${f.note}`)??0)+1); }
  for (const canal of ['A','B','C']) {
    const ent = [...uso].filter(([k])=>k[0]===canal).map(([k,v])=>[Number(k.slice(2)),v]);
    const tot = ent.reduce((a,[,v])=>a+v,0);
    const err = ent.map(([n,v])=>[Math.abs(cents(n)-39.2),v]);
    const medio = err.reduce((a,[e,v])=>a+e*v,0)/tot;
    const peor = ent.sort((x,y)=>Math.abs(cents(y[0])-39.2)-Math.abs(cents(x[0])-39.2))[0];
    console.log(`${ruta.split('/').pop()} canal ${canal}: desviacion media respecto al offset global ${medio.toFixed(1)} cents; peor nota ${peor[0]} (${(cents(peor[0])-39.2).toFixed(1)} cents, ${peor[1]} veces de ${tot})`);
  }
}
