# Ilustração de fundo: rua de prédios portugueses com um letreiro "ARRENDA-SE".
# Gera public/img/rua.svg (1600×700), usado na página inicial e na faixa das páginas de conteúdo.
# Desenho original, feito só com formas simples: não usa imagens de terceiros.
import random
random.seed(7)
W,H,CHAO=1600,700,640
cores=[("#F3D9B1","#E2BF8C"),("#E9B7A4","#D49884"),("#CFE5DE","#AFCFC5"),("#F6EEDF","#E3D6BF"),("#C9DAEC","#A9C2DC"),("#F2C9A0","#DDAE80"),("#E4D3E9","#CDB8D6"),("#F6E3B4","#E4CC8E")]
predios=[(0,190,470),(190,230,540),(420,170,430),(590,250,580),(840,200,500),(1040,240,560),(1280,170,450),(1450,170,520)]
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="1600" height="700">',
'<defs>',
'<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9FD4E8"/><stop offset=".65" stop-color="#E7F3F2"/><stop offset="1" stop-color="#FBEFD9"/></linearGradient>',
'<linearGradient id="vidro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D5A73"/><stop offset=".55" stop-color="#22374A"/><stop offset="1" stop-color="#5B7C95"/></linearGradient>',
'<pattern id="azul" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#EEF4FA"/><path d="M11 2l9 9-9 9-9-9z" fill="none" stroke="#2F5D9A" stroke-width="1.6"/><circle cx="11" cy="11" r="2.4" fill="#2F5D9A"/><path d="M0 0h4M18 0h4M0 22h4M18 22h4" stroke="#2F5D9A" stroke-width="1.2"/></pattern>',
'<pattern id="calcada" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="#E9E4DA"/><path d="M0 14 Q7 4 14 14 T28 14" fill="none" stroke="#2B2B2B" stroke-width="2.2" opacity=".55"/></pattern>',
'</defs>',
f'<rect width="{W}" height="{H}" fill="url(#ceu)"/>',
# nuvens suaves e sol
'<circle cx="1320" cy="120" r="54" fill="#FFF3C4" opacity=".9"/>',
'<g fill="#FFFFFF" opacity=".75"><ellipse cx="380" cy="90" rx="90" ry="22"/><ellipse cx="440" cy="76" rx="60" ry="20"/><ellipse cx="1050" cy="70" rx="110" ry="20"/><ellipse cx="1110" cy="58" rx="60" ry="18"/></g>']
def janela(x,y,w,h,estado,porta=False):
    s=[]
    if porta:
        s.append(f'<path d="M{x} {y+h}V{y+w/2}a{w/2} {w/2} 0 0 1 {w} 0V{y+h}z" fill="#6B3F2A"/>')
        s.append(f'<path d="M{x+w/2} {y+w/2+4}V{y+h}" stroke="#4E2C1D" stroke-width="2"/>')
        s.append(f'<circle cx="{x+w/2+6}" cy="{y+h*.62}" r="2" fill="#E3C27A"/>')
        return s
    s.append(f'<rect x="{x-3}" y="{y-3}" width="{w+6}" height="{h+6}" rx="2" fill="#FFFFFF" opacity=".95"/>')
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#vidro)"/>')
    s.append(f'<path d="M{x+w/2} {y}V{y+h}M{x} {y+h*.42}H{x+w}" stroke="#FFFFFF" stroke-width="2.2"/>')
    if estado=="portadas":
        s.append(f'<rect x="{x-w*.42}" y="{y}" width="{w*.38}" height="{h}" fill="#2E7D5B"/><rect x="{x+w*1.04}" y="{y}" width="{w*.38}" height="{h}" fill="#2E7D5B"/>')
        for k in range(4):
            yy=y+6+k*(h-10)/4
            s.append(f'<path d="M{x-w*.4} {yy}h{w*.34}M{x+w*1.06} {yy}h{w*.34}" stroke="#23634A" stroke-width="1.4"/>')
    if estado=="estore":
        s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h*.45}" fill="#E8DCC6"/>')
        for k in range(5):s.append(f'<path d="M{x} {y+3+k*h*.09}h{w}" stroke="#CDBE9F" stroke-width="1"/>')
    if estado=="flores":
        s.append(f'<rect x="{x-4}" y="{y+h}" width="{w+8}" height="8" fill="#9C5B3B"/>')
        for k in range(5):s.append(f'<circle cx="{x+2+k*(w-4)/4}" cy="{y+h-2}" r="4.2" fill="{random.choice(["#E0475B","#F29E38","#D9418C"])}"/>')
    return s
def varanda(x,y,w):
    s=[f'<rect x="{x-8}" y="{y}" width="{w+16}" height="5" fill="#3B3B3B"/>']
    for k in range(int((w+16)/7)+1):s.append(f'<path d="M{x-8+k*7} {y-26}V{y}" stroke="#3B3B3B" stroke-width="1.6"/>')
    s.append(f'<path d="M{x-8} {y-26}H{x+w+8}" stroke="#3B3B3B" stroke-width="2.4"/>')
    return s
letreiro=None
for i,(x,w,h) in enumerate(predios):
    cor,sombra=cores[i%len(cores)];topo=CHAO-h
    azulejo=i in (1,5)
    out.append(f'<rect x="{x}" y="{topo}" width="{w}" height="{h}" fill="{"url(#azul)" if azulejo else cor}"/>')
    out.append(f'<rect x="{x+w-10}" y="{topo}" width="10" height="{h}" fill="{sombra}" opacity=".6"/>')
    # cornija e telhado
    out.append(f'<rect x="{x-6}" y="{topo-10}" width="{w+12}" height="12" fill="#FFFFFF"/>')
    if i%2==0:out.append(f'<path d="M{x-4} {topo-10}L{x+18} {topo-46}H{x+w-18}L{x+w+4} {topo-10}z" fill="#B8553A"/>'+''.join(f'<path d="M{x+24+k*16} {topo-42}v30" stroke="#9A4430" stroke-width="2"/>' for k in range(int((w-40)/16))))
    # faixas brancas entre pisos
    pisos=int((h-90)/92)
    cols=max(2,int(w/80))
    jw=min(38,w/cols*.46);jh=58
    for p in range(pisos):
        yy=topo+28+p*92
        out.append(f'<rect x="{x}" y="{yy+jh+18}" width="{w}" height="4" fill="#FFFFFF" opacity=".7"/>')
        for c in range(cols):
            cx=x+(c+.5)*w/cols-jw/2
            estado=random.choice(["portadas","estore","flores","simples","portadas"])
            if i==7 and p==0 and c==0 and letreiro is None:
                letreiro=(cx,yy)
                estado="simples"
            out+=janela(cx,yy,jw,jh,estado)
            if p>0 and (i+p)%3==0:out+=varanda(cx,yy+jh+4,jw)
    # rés-do-chão: porta e montra
    out+=janela(x+w*.18,CHAO-86,34,86,"",porta=True)
    out.append(f'<rect x="{x+w*.45}" y="{CHAO-74}" width="{w*.4}" height="52" rx="3" fill="url(#vidro)" stroke="#FFFFFF" stroke-width="3"/>')
    out.append(f'<rect x="{x}" y="{CHAO-16}" width="{w}" height="16" fill="{sombra}"/>')
# letreiro ARRENDA-SE (clássico, vermelho sobre branco) pendurado na janela
lx,ly=letreiro
out.append(f'<g transform="translate({lx-34} {ly+8}) rotate(-3)"><rect width="132" height="40" rx="3" fill="#FFFFFF" stroke="#C8102E" stroke-width="4"/>'
           f'<text x="66" y="26" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="14" fill="#C8102E" letter-spacing=".5">ARRENDA-SE</text></g>')
# candeeiro, árvore e passeio em calçada
out.append(f'<rect x="0" y="{CHAO}" width="{W}" height="{H-CHAO}" fill="url(#calcada)"/>')
out.append(f'<path d="M560 {CHAO}V470" stroke="#2B2B2B" stroke-width="5"/><path d="M560 474h22" stroke="#2B2B2B" stroke-width="4"/><path d="M574 474l-8 18h28l-8-18z" fill="#2B2B2B"/><rect x="571" y="492" width="14" height="6" fill="#FFE7A3"/>')
out.append(f'<path d="M1240 {CHAO}V560" stroke="#6B4A2E" stroke-width="10"/><circle cx="1240" cy="520" r="54" fill="#5E9E6B"/><circle cx="1206" cy="548" r="34" fill="#6FB07B"/><circle cx="1272" cy="546" r="36" fill="#4F8C5C"/>')
out.append('</svg>')
open(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','public','img','rua.svg'),'w').write('\n'.join(out))
print(len('\n'.join(out)))
