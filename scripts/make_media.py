"""Original silent animated lessons; Chinese closed captions are separate WebVTT assets."""
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, pathlib, imageio_ffmpeg, json

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'media'
OUT.mkdir(parents=True, exist_ok=True)
FONT = 'C:/Windows/Fonts/msyh.ttc'
def font(n): return ImageFont.truetype(FONT, n)
BG='#123f36'; WHITE='#f4f6e8'; LIME='#d8ef9b'; TEAL='#2d6555'; GRAY='#a6c4b5'; GOLD='#efd1a1'
TITLES=['说得像专家，就可信吗？','查到资料，就能放心了吗？','一个分数，能说明它好用吗？']
CUES=[
 [(0,10,'同一个问题：一个机器人很自信，一个提醒材料不足。你会信哪个？'),(10,25,'材料只写“工作日响应”，回答却承诺“每天24小时”。新增条件缺少依据。'),(25,45,'逐条标出有支持、没支持和需要补材料。流畅与依据，要分开判断。'),(45,60,'材料不足时说明缺口、请求补充。这能降低风险，但不能保证所有回答正确。')],
 [(0,10,'拿到一份文件，就能保证回答正确吗？一起跟机器人去资料室。'),(10,25,'问题引导检索，外部材料提供给生成环节。检索增强让外部材料参与回答。'),(25,45,'没找到资料，检查覆盖和检索；资料足够却添加条件，检查生成如何使用材料。'),(45,60,'找到材料与正确使用材料，需要分别验证。检索增强不保证所有答案正确。')],
 [(0,10,'两个模拟系统都是85分，但关键任务失败不同。只看总分，够吗？'),(10,25,'依据一致性检查回答是否由给定上下文支持。它只是评估的一部分。'),(25,45,'答案忠实复述旧材料，不代表当前事实准确。条件变化后，应复核受影响结论。'),(45,60,'拆分维度、检查失败样例、标出待确认条件。把判断带回自己的工作。')]
]
def text(d,x,y,s,size=26,color=WHITE): d.text((x,y),s,font=font(size),fill=color)
def card(d,xy,title,sub='',color=TEAL):
 d.rounded_rectangle(xy,radius=18,fill=color)
 text(d,xy[0]+22,xy[1]+22,title,26)
 if sub: text(d,xy[0]+22,xy[1]+68,sub,18,GRAY)
def pet(d,cx,cy,t,scale=1,color=LIME):
 y=cy+math.sin(t*2)*7; r=43*scale
 d.ellipse((cx-r,y-r,cx+r,y+r),fill=color)
 for dx in [-14,14]: d.ellipse((cx+dx*scale-4,y-7,cx+dx*scale+4,y+6),fill=BG)
 d.arc((cx-10,y+10,cx+10,y+23),0,180,fill=BG,width=3)
 for i in range(3):
  a=t*.4+i*2.1; px=cx+math.cos(a)*r*1.6; py=y+math.sin(a)*r*1.15
  d.ellipse((px-4,py-4,px+4,py+4),fill=LIME)
def arrow(d,a,b,t):
 d.line((a,b),fill=GRAY,width=3)
 u=(t%3)/3; x=a[0]+(b[0]-a[0])*u;y=a[1]+(b[1]-a[1])*u
 d.ellipse((x-6,y-6,x+6,y+6),fill=LIME)
 d.polygon([(b[0],b[1]),(b[0]-9,b[1]-6),(b[0]-9,b[1]+6)],fill=GRAY)
def frame(i,t):
 im=Image.new('RGB',(960,540),BG);d=ImageDraw.Draw(im)
 for x in range(30,960,40):
  for y in range(20,500,40):d.ellipse((x,y,x+1,y+1),fill='#275044')
 text(d,38,25,'识光 / 一分钟发现',18,LIME);text(d,38,69,TITLES[i],34)
 scene=0 if t<10 else 1 if t<25 else 2 if t<45 else 3
 text(d,795,29,f'0{i+1} · {scene+1}/4',18,GRAY)
 if i==0:
  if scene==0:
   card(d,(70,158,445,265),'“每天 24 小时响应！”','机器人 A · 自信流畅')
   card(d,(510,158,885,265),'“材料还不够，我不确定。”','机器人 B · 提醒信息不足')
   pet(d,255,355,t,1.15);pet(d,695,355,t+1,1.15,GOLD)
  elif scene==1:
   card(d,(60,155,420,345),'给定材料','仅提供：工作日响应')
   card(d,(540,155,900,345),'机器人回答','承诺：每天 24 小时响应')
   arrow(d,(430,250),(530,250),t);text(d,565,285,'新增承诺 / 没有支持',23,GOLD)
   pet(d,470,397,t,.7)
  elif scene==2:
   for j,(a,b,c) in enumerate([('工作日响应','有材料支持',TEAL),('24 小时响应','新增承诺缺支持','#765c43'),('周末服务吗？','需要补充材料','#315569')]):
    y=150+j*83;card(d,(120,y,840,y+70),a,color=c);text(d,545,y+22,b,23,LIME)
  else:
   pet(d,225,273,t,1.8);card(d,(405,165,890,350),'让依据决定判断','说明不足 → 请求补充 → 重新核对')
   text(d,428,302,'降低风险 ≠ 保证全部正确',22,GOLD)
 elif i==1:
  if scene==0:
   pet(d,245+math.sin(t*.4)*35,310,t,1.5)
   for j in range(3):card(d,(490+j*80,180+j*22,700+j*80,330+j*22),'资料' if j==2 else '',color=['#235647','#2a6150',TEAL][j])
   text(d,55,405,'拿到文件，只是开始。',25,LIME)
  elif scene==1:
   for j,s in enumerate(['问题','检索','材料','生成']):
    x=50+j*232;card(d,(x,205,x+170,315),s,['用户需要','寻找相关信息','给定上下文','形成回答'][j]);
    if j<3:arrow(d,(x+179,260),(x+220,260),t+j)
   pet(d,480,405,t,.7)
  elif scene==2:
   card(d,(65,165,455,355),'路径 A / 资料不足','先检查覆盖与检索',color='#315569')
   card(d,(505,165,895,355),'路径 B / 新增条件','先检查生成使用',color='#765c43')
   pet(d,250,415,t,.7);pet(d,690,415,t+1,.7)
  else:
   card(d,(140,170,820,345),'材料找到 ≠ 回答正确','把问题、材料、回答放在一起核对')
   pet(d,480,415,t,.8)
 else:
  if scene==0:
   for j in range(2):
    x=85+j*440;card(d,(x,150,x+350,360),f'模拟系统 {"AB"[j]}');text(d,x+120,206,'85',70,LIME)
    for k,w in enumerate(([190,75,130] if j==0 else [80,185,130])):d.rounded_rectangle((x+30,302+k*13,x+30+w,309+k*13),radius=3,fill=GOLD if k==j else GRAY)
  elif scene==1:
   card(d,(75,170,420,355),'给定上下文','哪些陈述有支持？');card(d,(540,170,885,355),'生成回答','逐条核对陈述')
   arrow(d,(435,260),(525,260),t);text(d,290,404,'依据一致性 / 评估的一个维度',25,LIME)
  elif scene==2:
   card(d,(65,165,455,350),'旧版材料 / 过去适用','保留历史判断');card(d,(505,165,895,350),'新版条件 / 已有变化','复核受影响结论',color='#765c43')
   pet(d,480,415,t,.7)
  else:
   for j,s in enumerate(['评估维度','失败样例','待确认条件']):card(d,(75+j*280,178,325+j*280,326),s,['支持 / 事实 / 任务','输入 + 材料 + 回答','版本 + 适用范围'][j])
   pet(d,480,410,t,.7)
 d.rounded_rectangle((38,486,922,491),radius=2,fill=TEAL)
 d.rounded_rectangle((38,486,38+884*min(t/60,1),491),radius=2,fill=LIME)
 text(d,38,505,'原创教学动画 · 模拟案例 · 字幕可开关',14,GRAY)
 return im
def stamp(t):return f'00:{t:02d}.000' if t<60 else '01:00.000'
for i in range(3):
 id=f'V0{i+1}'
 frame(i,2).save(OUT/f'{id}.png')
 (OUT/f'{id}.vtt').write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(a)} --> {stamp(b)}\n{s}' for a,b,s in CUES[i])+'\n',encoding='utf-8')
 command=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','960x540','-r','12','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/f'{id}.mp4')]
 p=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 for f in range(60*12):p.stdin.write(frame(i,f/12).tobytes())
 p.stdin.close()
 if p.wait():raise RuntimeError('Video encoding failed')
 print(f'{id}: 60s animated MP4, poster, WebVTT complete',flush=True)
(OUT/'manifest.json').write_text(json.dumps({'original':True,'audio':False,'duration':60,'fps':12,'resolution':[960,540],'license':'Original assets created for this project','contentReview':'2026-10-12'},ensure_ascii=False,indent=2),encoding='utf-8')
