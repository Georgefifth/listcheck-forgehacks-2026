from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import cv2,json,subprocess
root=Path(__file__).resolve().parents[1];movie=root/'listcheck-live-demo.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(movie)]))
(root/'live-demo'/'media-probe.json').write_text(json.dumps(probe,indent=2))
cap=cv2.VideoCapture(str(movie));duration=float(probe['format']['duration']);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
# All sections sampled every two seconds, plus full-resolution inspection frames.
frames=[]
for second in range(0,int(duration),2):
 cap.set(cv2.CAP_PROP_POS_MSEC,second*1000);ok,frame=cap.read()
 if not ok:continue
 image=Image.fromarray(cv2.cvtColor(frame,cv2.COLOR_BGR2RGB));image.thumbnail((384,216));frames.append((second,image))
for page in range((len(frames)+19)//20):
 sheet=Image.new('RGB',(1536,1180),'#ffffff');d=ImageDraw.Draw(sheet)
 for j,(t,img) in enumerate(frames[page*20:(page+1)*20]):
  x=(j%4)*384;y=(j//4)*236;sheet.paste(img,(x,y));d.text((x+8,y+216),f'{t//60:02d}:{t%60:02d}',font=font,fill='black')
 sheet.save(root/'live-demo'/f'review-sheet-{page+1}.jpg',quality=90)
for second in [6,35,75,94,110,145,175,195]:
 if second>=duration:continue
 cap.set(cv2.CAP_PROP_POS_MSEC,second*1000);ok,f=cap.read()
 if ok:cv2.imwrite(str(root/'live-demo'/f'final-frame-{second}.jpg'),f)
cap.release();print('duration',duration,'sampled frames',len(frames),'streams',[(s['codec_type'],s['codec_name']) for s in probe['streams']])
