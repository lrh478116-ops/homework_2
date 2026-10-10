"""使用 bundled Python + ReportLab 生成三页中文作业说明。"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'delivery'
OUT.mkdir(exist_ok=True)
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
c = canvas.Canvas(str(OUT / '智变_网站亮点说明.pdf'), pagesize=(595.28, 841.89))
c.setTitle('智变 人工智能与新质生产力 网站亮点说明')
c.setAuthor('智变网站项目')
style = ParagraphStyle('body', fontName='STSong-Light', fontSize=10.5, leading=18, textColor=HexColor('#354052'), wordWrap='CJK')

def text(content, y, size=10.5, leading=18):
    s = ParagraphStyle('local', parent=style, fontSize=size, leading=leading)
    p = Paragraph(content, s)
    _, h = p.wrap(499, 750)
    p.drawOn(c, 48, y-h)
    return y-h-12

def header(number, title):
    c.setFillColor(HexColor('#4d6c31')); c.setFont('STSong-Light', 9)
    c.drawString(48, 804, '智变  /  人工智能与新质生产力')
    c.setFillColor(HexColor('#101724')); c.setFont('STSong-Light', 22)
    c.drawString(48, 763, title)
    c.setStrokeColor(HexColor('#d8dfe6')); c.line(48, 744, 547, 744)
    c.setFont('STSong-Light', 9); c.setFillColor(HexColor('#6d7784'))
    c.drawString(48, 30, '交互可视化作业   |   数据来源核查日期 2026 年 10 月 10 日')
    c.drawRightString(547, 30, f'{number} / 3')

def heading(title, y):
    c.setFillColor(HexColor('#172132')); c.setFont('STSong-Light', 14)
    c.drawString(48, y-16, title)
    return y-32

header(1, '设计思路与信息框架')
y = text('本次改版先形成设计思路，再明确页面框架，最后实现页面。网站用公开数据、产业流程与交互实验解释人工智能怎样成为新质生产力。核心判断是：技术需要进入协作、执行与反馈，才能形成可衡量的生产价值。', 724)
img = ROOT / 'docs/screenshots/01-overview.png'
c.drawImage(ImageReader(str(img)), 48, y-295, width=499, height=295, preserveAspectRatio=True, anchor='c')
y -= 307
y = text('图 1  新版首页实际画面  浅色背景、深色正文、蓝色重点与简单价值链。', y, 9, 15)
y = heading('朴素实用的设计原则', y)
y = text('主题一眼能懂，数据容易比较，交互帮助判断。移除装饰球体、英文段落和绕圈节点，增加正文可读性。颜色用于标明重点与状态，统计、研究、概念和模拟均有文字说明。每节只回答一个问题，来源和边界放在相关内容旁。', y)
y = heading('六个问题构成页面框架', y)
y = text('认识主题 → 查看数据 → 理解机制 → 产业应用 → 生产力实验 → 发展与边界。读者可以顺序学习，也可以直接进入实验室比较方案。四要素按钮、产业步骤和来源搜索支持按问题探索；静态网页保持相对路径、手机布局和键盘操作。', y)
c.showPage()

header(2, '关键交互与生产力实验')
y = text('网站的复杂度体现为可操作的解释机制。控件改变的是可见图表、具体场景与计算结果，而不只是装饰效果。', 724)
y = heading('从查看信息到实际比较', y)
y = text('年份选择与原始记录表帮助核对数据。六个产业的五步流程可以逐步点击，查看作用与核查点。实验室支持滑块和数字输入同步；当前参数可保存为 A 或 B，独立快照不会随滑块改变，并可导出两方案对比 CSV。来源库支持名称、年份和关键词搜索。', y)
img = ROOT / 'docs/screenshots/06-comparison.png'
c.drawImage(ImageReader(str(img)), 48, y-281, width=499, height=281, preserveAspectRatio=True, anchor='c')
y -= 293
y = text('图 2  新版方案对比实际画面  两组独立参数重新计算阶段、总耗时与吞吐量。', y, 9, 15)
y = heading('可反事实验证的教学模型', y)
y = text('基础工作流为 100 分钟。AI 覆盖率、数据质量与额外复核成本共同决定四个阶段的耗时。默认参数下，新耗时为 79.14 分钟，节省 20.86 分钟，同时间吞吐量提高约 26.4%。这是教学假设的计算结果，不能作为真实企业预测。', y)
y = text('“复核过重”产生负收益，“关闭 AI”恢复 100 分钟和零增益。空值、越界和非整数输入清空当前结果并阻断保存与导出；A/B 仅保存验证后的参数并重新计算，不接受伪造结果。清空方案和刷新页面不会复用旧快照。', y)
c.showPage()

header(3, '数据可信性与提交方式')
y = heading('来源与统计边界', 724)
items = [
 ('Stanford AI Index 2025 与 2026', '2023、2024、2025 年组织 AI 采用率为 55%、78%、88%。指标是受访组织自报使用，跨年样本可能变化；2025 年部分地区私人投资对比不等于完整国家排名。', 'https://hai.stanford.edu/ai-index/2026-ai-index-report/economy'),
 ('NBER Generative AI at Work', '绑定 2023 年 11 月工作论文版本：5,179 名客服人员，每小时解决问题数平均提高 14%，新手及低技能群体提高 34%。特定工作场景不能外推为全行业或 GDP 增幅。', 'https://www.nber.org/papers/w31161'),
 ('Stanford AI Index 推理价格', '固定 MMLU 能力阈值下，API 价格从 2022 年 11 月的 20 美元降至 2024 年 10 月的 0.07 美元每百万 token，降幅超过 280 倍。非所有模型价格或总部署成本。', 'https://hai.stanford.edu/ai-index/2025-ai-index-report/research-and-development'),
 ('IEA Key Questions on Energy and AI 2026', '全球数据中心耗电：2025 年估计约 485 TWh，2030 年中心情景预测约 950 TWh。包括非 AI 负载，未来值存在不确定性。', 'https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary'),
 ('国家发展改革委 新质生产力概念', '以劳动者、劳动资料、劳动对象与要素协同解释主题。网站价值链是作者解读，产业流程为机制示意，未包装为已部署系统。', 'https://www.ndrc.gov.cn/wsdwhfz/202403/t20240301_1364322_ext.html'),
]
for title, body, url in items:
    y = text(f'<b>{title}</b><br/>{body} <link href="{url}" color="#426132">阅读来源</link>', y, 10, 16)
y = heading('本地运行与后续发布', y)
y = text('网站已上传至 lrh478116-ops/homework_2，并使用 GitHub Pages 发布。<link href="https://lrh478116-ops.github.io/homework_2/" color="#426132">打开网站 https://lrh478116-ops.github.io/homework_2/</link><br/>本地复现：在源码目录执行 node scripts/serve.mjs，浏览器访问 http://127.0.0.1:4173。源码保留发布工作流与测试，可继续修改并重新部署。', y, 10, 16)
y = heading('提交材料', y)
y = text('配套包含网站源代码压缩包、本说明 PDF 和带中文合成语音讲解的实际网页演示视频。视频展示年份切换、产业流程与正常及负向模拟。公开数据和当前模拟可以分别从网页导出 CSV；所有公式和统计边界均可查看。', y, 10, 16)
if y < 55:
    raise RuntimeError(f'页面内容过低，需重新排版：{y}')
c.save()
print(OUT / '智变_网站亮点说明.pdf')
