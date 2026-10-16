from pathlib import Path
import math,random
random.seed(5)
p=Path('public/assets')
# Original vector drawing: architectural fantasy, explicitly not a historical record.
s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 760"><defs><pattern id="paper" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".4" fill="#50634c" opacity=".17"/></pattern><linearGradient id="fade" x2="0" y2="1"><stop stop-color="#e9e9d8"/><stop offset="1" stop-color="#d8ddc8"/></linearGradient></defs><path fill="url(#fade)" d="M0 0h900v760H0z"/><path fill="url(#paper)" d="M0 0h900v760H0z"/><g stroke="#5d7058" fill="none">']
for y in range(490,745,14):s.append(f'<path opacity=".18" d="M0 {y}h900"/>')
s+=['<path fill="#eceddd" stroke-width="2" d="M105 610V330Q105 113 450 72Q795 113 795 330V610Z"/>','<path d="M105 330h690M105 370h690M105 600h690M450 72V610M90 610h720M80 622h740" stroke-width="2"/>']
for x in range(150,800,50):
 top=75+255*(abs(x-450)/345)**2
 s.append(f'<path d="M{x} 610V{top:.1f}"/><path d="M450 72Q{x} 150 {x} 330" opacity=".8"/>')
for y in [155,215,275]:s.append(f'<path d="M{105+(330-y)*.35} {y} Q450 {y-90} {795-(330-y)*.35} {y}"/>')
s+=['<path d="M382 610V408a68 68 0 0 1 136 0v202M450 340v270M382 420h136M382 470h136M382 520h136"/>']
for base,scale in [(190,1),(325,.7),(580,.9),(720,1.1),(90,.65)]:
 by=605;ht=215*scale
 s.append(f'<path stroke-width="3" d="M{base} {by}Q{base+20} {by-ht*.6} {base} {by-ht}"/>')
 for side in [-1,1]:
  for j in range(6):
   y=by-ht+j*15*scale; ex=base+side*(95-j*8)*scale;ey=y+30+j*5
   s.append(f'<path stroke-width="1.5" d="M{base} {y}Q{ex} {y-45} {ex} {ey}Q{ex-side*20} {y-10} {base} {y}" fill="#637c5b" fill-opacity=".23"/>')
 s.append(f'<path fill="#b7b79a" d="M{base-28} 580h56l-8 45h-40z"/>')
s+=['</g><g fill="#314e3c" opacity=".85">']
for side in [0,1]:
 for j in range(15):
  x=(35+j*8) if side==0 else 860-j*7;y=740-j*29
  s.append(f'<path d="M{x} {y+50}q{-100 if side==0 else 100} -80 {-25 if side==0 else 25} -110q{65 if side==0 else -65} 60 {25 if side==0 else -25} 110z"/>')
s+=['</g><text x="450" y="687" text-anchor="middle" font-family="Georgia" font-size="13" letter-spacing="5" fill="#4b6047">HORTUS · SUB · VITRO</text></svg>']
(p/'conservatory.svg').write_text(''.join(s))
for name in ['fern','bonsai','palms']:
 s=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450"><path fill="#e7e8d8" d="M0 0h600v450H0z"/><g stroke="#3c6048" fill="#6f8868" fill-opacity=".35">']
 for k in range(7):
  angle=(k-3)*.27; bx=300;by=370;ex=bx+math.sin(angle)*210;ey=by-math.cos(angle)*280
  s.append(f'<path stroke-width="2" fill="none" d="M{bx} {by}Q{ex} 230 {ex} {ey}"/>')
  for j in range(9):
   t=j/10;x=bx+(ex-bx)*t;y=by+(ey-by)*t
   w=48*math.sin(t*math.pi)
   s.append(f'<path d="M{x} {y}q{-w} -45 {-w-8} -25q10 32 {w+8} 25M{x} {y}q{w} -45 {w+8} -25q-10 32 {-w-8} 25"/>')
 s.append('</g><path d="M247 359h106l-17 67h-72z" fill="#a39174"/><text x="30" y="40" fill="#58664d" font-family="Georgia" font-size="14">FLORA · STUDIUM</text></svg>')
 (p/(name+'.svg')).write_text(''.join(s))
