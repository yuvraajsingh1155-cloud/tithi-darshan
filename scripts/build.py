#!/usr/bin/env python3
"""Generate a fast, server-rendered Hindi Panchang website as static HTML.

Usage:
    python scripts/build.py
    python scripts/build.py --today 2026-11-23 --days 14  # fast demo
Production default: 7 recent days and 60 days ahead. Preserve previously generated date pages.

SITE_URL env var: exact deployed URL, e.g. https://your-project.pages.dev.
Required for sitemap.xml and canonical metadata, not for basic operation.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import shutil
import sys
import xml.sax.saxutils as xmlutils
from datetime import date, timedelta, datetime
from zoneinfo import ZoneInfo
from jinja2 import Environment, FileSystemLoader, select_autoescape
from panchang import panchang_for

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/'dist'
env=Environment(loader=FileSystemLoader(str(ROOT/'templates')), autoescape=select_autoescape(['html']))
CITIES=json.loads((ROOT/'data/cities.json').read_text(encoding='utf-8'))
FESTIVALS=json.loads((ROOT/'data/festivals.json').read_text(encoding='utf-8'))
CITY_SLUGS={c['slug'] for c in CITIES}
GUIDES={
 'tithi-kya-hai':{
   'name':'तिथि क्या है?', 'intro':'तिथि चंद्रमा और सूर्य की कोणीय दूरी पर आधारित चंद्र दिवस है। यह अंग्रेज़ी तारीख से अलग हो सकती है।',
   'sections':[
     {'heading':'हिंदू पंचांग में तिथि का अर्थ','paragraphs':['सूर्य और चंद्रमा की भू-केंद्रिक दीर्घांश दूरी हर 12 अंश बढ़ने पर नई तिथि आरंभ होती है। एक चंद्र मास में 30 तिथियाँ होती हैं: शुक्ल पक्ष की 15 और कृष्ण पक्ष की 15।','तिथि की अवधि निश्चित 24 घंटे नहीं होती। चंद्रमा की गति बदलती रहती है, इसलिए किसी तिथि का आरंभ और अंत दिन में कभी भी हो सकता है।']},
     {'heading':'आज कौन सी तिथि है, यह कैसे तय होता है?','paragraphs':['परंपरागत दैनिक पंचांग में प्रायः स्थानीय सूर्योदय के समय चल रही तिथि को दिन की तिथि कहा जाता है। पूजा-व्रत और पर्व की तिथि निर्धारित करने के नियम अलग हो सकते हैं।','दिल्ली और वाराणसी जैसे शहरों में सूर्योदय का समय अलग है। इसी कारण एक ही अंग्रेज़ी तारीख को परंपरागत दिन-तिथि का संदर्भ बदल सकता है।']},
     {'heading':'शुक्ल और कृष्ण पक्ष में क्या अंतर है?','paragraphs':['अमावस्या के बाद पूर्णिमा की ओर बढ़ते चंद्र चरण को शुक्ल पक्ष, और पूर्णिमा के बाद अमावस्या की ओर घटते चरण को कृष्ण पक्ष कहा जाता है।','हिंदू पर्व-निर्णय में पक्ष, तिथि, नक्षत्र और स्थानीय विशेष समयों का संयुक्त महत्व हो सकता है।']},
     {'heading':'तिथि से जुड़ी सावधानी','paragraphs':['केवल दैनिक तिथि देखकर विवाह, गृहप्रवेश या विशेष व्रत की निश्चित तारीख तय न करें। इन अवसरों के नियम अधिक विस्तृत होते हैं।']}
   ]
 },
 'shubh-muhurat':{
  'name':'शुभ मुहूर्त का अर्थ', 'intro':'किसी कार्य के लिए चुना गया अनुकूल काल पारंपरिक रूप से शुभ मुहूर्त कहलाता है। सभी कार्यों के लिए एक ही समय सही नहीं माना जाता।',
  'sections':[
    {'heading':'शुभ मुहूर्त क्या है?','paragraphs':['हिंदू परंपराओं में दैनिक समयों के साथ तिथि, नक्षत्र, वार, योग, करण तथा कार्य की प्रकृति को देखा जा सकता है। यहां दिखने वाले अभिजीत और ब्रह्म मुहूर्त सामान्य दैनिक काल हैं, व्यक्तिगत अनुष्ठान का चुनाव नहीं।']},
    {'heading':'अभिजीत मुहूर्त कैसे निकलता है?','paragraphs':['दिन के स्थानीय सूर्योदय और सूर्यास्त के बीच की अवधि को 15 समान भागों में बाँटकर मध्य के भाग को सामान्य अभिजीत मुहूर्त कहा जाता है। इसका समय शहर और मौसम के साथ बदलता है।','कुछ परंपराओं में बुधवार सहित विशिष्ट स्थितियों में अभिजीत के उपयोग को अलग ढंग से देखा जाता है। इसे हर कार्य के लिए स्वतः उपयुक्त न मानें।']},
    {'heading':'ब्रह्म मुहूर्त क्या है?','paragraphs':['एक आम प्रचलित गणना में ब्रह्म मुहूर्त सूर्योदय से लगभग 96 मिनट पहले शुरू और 48 मिनट पहले समाप्त होता है। इसे अध्ययन, ध्यान और प्रार्थना से जोड़ा जाता है।']},
    {'heading':'विवाह और गृहप्रवेश का मुहूर्त','paragraphs':['विशेष संस्कारों के लिए स्थानीय व्रत-विधान, क्षेत्रीय पंचांग तथा संबंधित व्यक्तियों की परिस्थितियों की अलग समीक्षा की जा सकती है। हमारी साइट सार्वभौमिक विवाह/गृहप्रवेश मुहूर्त का दावा नहीं करती।']}
  ]
 },
 'rahu-kaal':{
  'name':'राहुकाल क्या है?', 'intro':'राहुकाल एक पारंपरिक समय-खंड है जिसे कुछ मान्यताओं में नए शुभ कार्य शुरू करने के लिए टाला जाता है।',
  'sections':[
    {'heading':'राहुकाल की गणना','paragraphs':['स्थानीय सूर्योदय से सूर्यास्त की अवधि को 8 बराबर भागों में विभाजित किया जाता है। सप्ताह के दिन के अनुसार अलग भाग को राहुकाल कहते हैं। सोमवार को दूसरा, मंगलवार को सातवाँ और रविवार को आठवाँ भाग आता है।']},
    {'heading':'हर शहर में राहुकाल अलग क्यों है?','paragraphs':['सूर्योदय-सूर्यास्त की घड़ियाँ और दिन की लंबाई अलग होने से राहुकाल का आरंभ एवं समापन भी शहर के अनुसार बदलता है। एक शहर का समय पूरे भारत पर लागू नहीं होता।']},
    {'heading':'राहुकाल में क्या करना चाहिए?','paragraphs':['परंपरा मानने वाले लोग इस दौरान कुछ नए मांगलिक कार्य शुरू करने से बचते हैं। दैनिक काम, आवश्यक चिकित्सा, सुरक्षा या आपातकालीन काम को कालगणना के कारण टालना उचित नहीं है।','ये सांस्कृतिक विश्वास हैं, वैज्ञानिक रूप से किसी समय-खंड के शुभ-अशुभ परिणाम प्रमाणित नहीं हैं।']}
  ]
 },
 'panchang-ke-panch-ang':{
  'name':'पंचांग के पाँच अंग', 'intro':'पंचांग का अर्थ है पाँच अंग: तिथि, वार, नक्षत्र, योग और करण।',
  'sections':[
    {'heading':'1. तिथि','paragraphs':['सूर्य-चंद्रमा की आपसी दीर्घांश दूरी के प्रत्येक 12 अंश पर एक तिथि बनती है। कुल 30 तिथियाँ हैं।']},
    {'heading':'2. वार','paragraphs':['वार सोमवार, मंगलवार आदि सात दिनों को कहा जाता है। प्राचीन पंचांग में अनेक धार्मिक क्रियाओं में वार देखा जाता है।']},
    {'heading':'3. नक्षत्र','paragraphs':['आकाशीय निरयण वृत्त को 27 बराबर भागों में बाँटकर चंद्रमा जिस भाग में होता है उसे नक्षत्र कहा जाता है। प्रत्येक भाग 13 अंश 20 कला का होता है।']},
    {'heading':'4. योग','paragraphs':['सूर्य और चंद्रमा के निरयण दीर्घांशों को जोड़कर वृत्त को 27 बराबर भागों में विभाजित करते हैं। जिस भाग में योग आता है वह दिन का योग कहलाता है।']},
    {'heading':'5. करण','paragraphs':['करण तिथि का आधा भाग है: सूर्य-चंद्रमा की कोणीय दूरी में 6 अंश की वृद्धि पर अगला करण आता है। चल एवं स्थिर करणों का पारंपरिक नामकरण होता है।']}
  ]
 },
 'aaj-kya-kare':{
  'name':'आज क्या करना चाहिए?', 'intro':'दैनिक पूजा, संयम और पारिवारिक परंपराओं के लिए सामान्य जानकारी। अलग-अलग हिंदू परंपराओं में नियम अलग होते हैं।',
  'sections':[
    {'heading':'दैनिक पूजा कैसे करें?','paragraphs':['नित्य स्नान-स्वच्छता, सरल पूजा, प्रार्थना, ध्यान या जप बहुत से परिवारों की दिनचर्या का हिस्सा हैं। किसी महंगे अनुष्ठान की अनिवार्यता नहीं है।']},
    {'heading':'वार के अनुसार लोकपरंपराएँ','paragraphs':['सोमवार को शिव, मंगलवार को हनुमान, बुधवार को गणेश, गुरुवार को विष्णु या गुरु, शुक्रवार को देवी, शनिवार को शनि/हनुमान तथा रविवार को सूर्य उपासना कई क्षेत्रों में प्रचलित है। यह सम्पूर्ण भारत की एक ही अनिवार्य पद्धति नहीं है।']},
    {'heading':'आज क्या विशेष है, कैसे जानें?','paragraphs':['आज की तिथि का धार्मिक महत्व जानने के लिए पर्व, व्रत, नक्षत्र और क्षेत्रीय परंपरा देखें। केवल तिथि संख्या देखकर पर्व तय करने के बजाय प्रमाणित कैलेंडर देखें।']},
    {'heading':'किस काम को टालना नहीं चाहिए?','paragraphs':['स्वास्थ्य, आपातकाल, सुरक्षा, रोजगार और आवश्यक रोज़मर्रा के कामों को केवल मुहूर्त के कारण टालने की जरूरत नहीं है।']}
  ]
 },
 'hamare-bare-mein': {
  'name':'हमारे बारे में',
  'intro':'तिथि दर्शन एक हिंदी सूचना वेबसाइट है, जिसका उद्देश्य भारत के शहरों के लिए पंचांग की गणनाएँ और सामान्य धार्मिक परंपराएँ आसान भाषा में समझाना है।',
  'sections':[
   {'heading':'वेबसाइट क्या बताती है?','paragraphs':['स्थानीय सूर्योदय, तिथि, नक्षत्र, योग, करण और राहुकाल जैसे मान खगोलीय गणना के आधार पर प्रकाशित होते हैं। दिल्ली, लखनऊ, हरदोई, वाराणसी तथा अन्य शहरों के लिए अलग समय दिखाया जाता है।']},
   {'heading':'सटीकता और सीमाएँ','paragraphs':['तिथि और समय स्थानीय स्थान तथा प्रयोग की गई गणना-पद्धति के अनुसार बदल सकते हैं। किसी व्रत, पर्व, विवाह या गृहप्रवेश के लिए व्यक्तिगत निर्णय लेने से पहले मान्य क्षेत्रीय पंचांग से पुष्टि करें।']},
   {'heading':'गणना और पारदर्शिता','paragraphs':['खगोलीय गणना की विधि, अयनांश, समयक्षेत्र और अन्य धारणाओं का विवरण गणना पद्धति पृष्ठ पर उपलब्ध है। स्रोत कोड सार्वजनिक GitHub repository में उपलब्ध है।']}
  ]
 },
 'sampadakiya-neeti': {
  'name':'संपादकीय नीति और तथ्य-जाँच',
  'intro':'हम गणितीय पंचांग-समय, धार्मिक परंपराओं और क्षेत्रीय पर्व-निर्णय को अलग-अलग प्रकार की जानकारी मानते हैं।',
  'sections':[
   {'heading':'गणना-आधारित डेटा','paragraphs':['तिथि, नक्षत्र, योग, करण तथा सूर्योदय-सूर्यास्त के समय निर्दिष्ट खगोलीय पद्धति से निकाले जाते हैं। शहरों का स्थान और स्थानीय समय महत्वपूर्ण हैं।']},
   {'heading':'त्योहार और व्रत','paragraphs':['धार्मिक पर्व का दिन हमेशा सिर्फ सूर्योदय की तिथि देखकर नहीं चुना जाता। क्षेत्रीय नियम, प्रदोषकाल और अन्य परंपराएँ महत्वपूर्ण हो सकती हैं। इसलिए अनिश्चित पर्व के लिए निश्चितता का दावा नहीं किया जाता।']},
   {'heading':'सामान्य धार्मिक जानकारी','paragraphs':['पूजा एवं दान संबंधी सामग्री सांस्कृतिक और पारिवारिक परंपराओं को समझाने के लिए है; इसे अनिवार्य निर्देश या स्वास्थ्य, कानूनी अथवा आर्थिक सलाह न मानें।']},
   {'heading':'त्रुटि सुधार','paragraphs':['किसी गणना या सामग्री में गलती दिखे तो सार्वजनिक GitHub repository के Issues अनुभाग में स्थान, तारीख, विवरण और भरोसेमंद स्रोत के साथ रिपोर्ट दी जा सकती है। निजी जानकारी सार्वजनिक Issue में न डालें।']}
  ]
 },
 'gopniyata-neeti': {
  'name':'गोपनीयता नीति',
  'intro':'यह पृष्ठ बताता है कि तिथि दर्शन वेबसाइट का मौजूदा तकनीकी संस्करण किस तरह डेटा का उपयोग करता है।',
  'sections':[
   {'heading':'आपसे क्या जानकारी माँगते हैं?','paragraphs':['वेबसाइट के मौजूदा संस्करण में उपयोगकर्ता खाता, लॉगिन, भुगतान या जानकारी भेजने का फॉर्म नहीं है। शहर चुनने जैसे विकल्प ब्राउज़र में सामान्य नेविगेशन के लिए हैं।']},
   {'heading':'होस्टिंग और बाहरी सेवाएँ','paragraphs':['वेबसाइट Cloudflare Pages पर होस्ट है। साइट तक पहुँचने पर होस्टिंग प्रदाता सामान्य तकनीकी अनुरोध डेटा जैसे IP पता और ब्राउज़र विवरण अपनी नीतियों के अनुसार संसाधित कर सकता है। अक्षरों के लिए Google Fonts से फ़ाइलें डाउनलोड हो सकती हैं।']},
   {'heading':'एनालिटिक्स और विज्ञापन','paragraphs':['इस संस्करण में Google Analytics या AdSense का ट्रैकिंग कोड नहीं लगाया गया है। भविष्य में इन सेवाओं को जोड़ने पर इस नीति को उनकी भूमिका के अनुसार अपडेट किया जाना चाहिए।']},
   {'heading':'तृतीय पक्ष के लिंक और बदलाव','paragraphs':['बाहरी साइटों पर जाने पर उनकी गोपनीयता नीतियाँ लागू होती हैं। सामग्री एवं तकनीक बदलने पर इस पृष्ठ को अपडेट किया जा सकता है।']}
  ]
 },
 'sampark': {
  'name':'संपर्क और त्रुटि रिपोर्ट',
  'intro':'तिथि दर्शन पर किसी गणना, समय या सामग्री के बारे में सुझाव हो तो स्रोत सहित स्पष्ट सूचना देना उपयोगी है।',
  'sections':[
   {'heading':'त्रुटि कैसे रिपोर्ट करें?','paragraphs':['GitHub repository के Issues अनुभाग में संबंधित शहर, अंग्रेज़ी तारीख, दिखाया गया मान, अपेक्षित सुधार और विश्वसनीय स्रोत के साथ रिपोर्ट लिखें। Repository: https://github.com/yuvraajsingh1155-cloud/tithi-darshan/issues']},
   {'heading':'निजी सूचना सुरक्षित रखें','paragraphs':['GitHub Issues सार्वजनिक हो सकते हैं। वहाँ फोन नंबर, घर का पता, जन्मपत्री, पहचान-पत्र या कोई अन्य निजी जानकारी साझा न करें।']}
  ]
 }
,
 'nakshatra-kya-hai': {
   'name':'नक्षत्र क्या है और आज का नक्षत्र कैसे जानें?',
   'intro':'नक्षत्र चंद्रमा की निरयण स्थिति के आधार पर पहचाने जाने वाले 27 आकाशीय खंड हैं। तिथि और नक्षत्र अलग गणनाएँ हैं।',
   'sections':[
     {'heading':'नक्षत्र का आसान अर्थ','paragraphs':['पारंपरिक पंचांग में 360 अंश के निरयण चक्र को 27 बराबर भागों में बाँटा जाता है। प्रत्येक भाग 13 अंश 20 कला का होता है। सूर्योदय के समय चंद्रमा जिस भाग में होता है, उसे उस दिन के नक्षत्र के रूप में दर्शाया जा सकता है।','अश्विनी, भरणी, कृत्तिका, रोहिणी से लेकर रेवती तक 27 नक्षत्रों के नाम प्रचलित हैं। इन्हें आकाश में दिखने वाले तारामंडलों से जोड़ने की परंपरा है, जबकि वेबसाइट पर नक्षत्र की गणना चंद्रमा के निरयण देशांतर से होती है।']},
     {'heading':'नक्षत्र कब बदलता है?','paragraphs':['चंद्रमा की गति समान नहीं रहती। इसलिए कोई नक्षत्र हमेशा निश्चित 24 घंटे नहीं चलता। समाप्ति समय वह समय है जब चंद्रमा अगले 13 अंश 20 कला वाले खंड में प्रवेश करता है।','उदाहरण के लिए नक्षत्र सूर्योदय के समय भरणी हो सकता है, लेकिन उसी रात या अगले दिन सुबह कृत्तिका शुरू हो सकती है। सही उत्तर के लिए तारीख के साथ नक्षत्र का समाप्ति समय भी पढ़ें।']},
     {'heading':'तिथि और नक्षत्र में क्या फर्क है?','paragraphs':['तिथि, सूर्य और चंद्रमा की आपसी कोणीय दूरी में हर 12 अंश पर बदलती है। नक्षत्र, केवल चंद्रमा की निरयण स्थिति के प्रत्येक 13 अंश 20 कला पर बदलता है। इसलिए दोनों का बदलाव एक ही घड़ी में होना जरूरी नहीं है।']},
     {'heading':'स्थानीय परंपराएँ','paragraphs':['नक्षत्र आधारित पूजा, व्रत और संस्कार के विशेष नियम अलग परंपराओं में अलग होते हैं। केवल दैनिक नक्षत्र देखकर हर आयोजन के लिए शुभ मुहूर्त घोषित करना उचित नहीं है।']}
   ]
 },
 'amavasya-purnima': {
   'name':'अमावस्या और पूर्णिमा क्या हैं? तिथि कैसे तय होती है?',
   'intro':'अमावस्या और पूर्णिमा चंद्रमास की दो महत्वपूर्ण तिथियाँ हैं; दोनों का आरंभ-अंत खगोलीय गणना से निर्धारित होता है।',
   'sections':[
     {'heading':'पूर्णिमा का अर्थ','paragraphs':['शुक्ल पक्ष की पंद्रहवीं तिथि पूर्णिमा कहलाती है। चंद्रमा और सूर्य के भू-केंद्रिक देशांतर का अंतर 180 अंश के आसपास पहुँचता है। पूर्णिमा तिथि के दौरान चंद्रमा सामान्यतः पूर्ण या लगभग पूर्ण दिखता है।','पूर्णिमा किसी अंग्रेज़ी तारीख पर सुबह शुरू हो और शाम समाप्त हो, यह आवश्यक नहीं है। एक शहर के दैनिक पंचांग में सूर्योदय पर पूर्णिमा होने का अर्थ यह नहीं कि तिथि पूरे दिन बनी रहेगी।']},
     {'heading':'अमावस्या का अर्थ','paragraphs':['कृष्ण पक्ष की पंद्रहवीं तिथि अमावस्या कहलाती है। यह सूर्य और चंद्रमा के देशांतरों के निकट आने वाले चरण से संबंधित है। अमावस्या पर चंद्रमा प्रायः दिखाई नहीं देता।','अमावस्या की पूजा और पितृ-संबंधी परंपराएँ क्षेत्र तथा संप्रदाय के अनुसार अलग हो सकती हैं।']},
     {'heading':'अंग्रेज़ी तारीख और पंचांग में अंतर','paragraphs':['अंग्रेज़ी तारीख आधी रात में बदलती है, जबकि पंचांग के दैनिक वर्णन में स्थानीय सूर्योदय को विशेष महत्व मिल सकता है। साथ ही एक तिथि का समाप्ति समय दिन के बीच भी आ सकता है। इसलिए केवल कैलेंडर तारीख देखकर पूर्णिमा/अमावस्या के सभी अनुष्ठानों का समय तय न करें।']},
     {'heading':'पर्व-निर्णय में सावधानी','paragraphs':['पूर्णिमा या अमावस्या से जुड़े अलग पर्वों में प्रदोष, मध्यरात्रि या सूर्योदय-व्यापिनी तिथि जैसे नियम लागू हो सकते हैं। अपने क्षेत्र के मान्य पंचांग से व्रत का दिन सत्यापित करें।']}
   ]
 },
 'ekadashi-kab-hai': {
   'name':'एकादशी कब है? व्रत की तिथि और पारण कैसे समझें?',
   'intro':'एकादशी हर चंद्र पक्ष की ग्यारहवीं तिथि है, लेकिन व्रत रखने और पारण का दिन केवल एक तिथि संख्या देखकर तय नहीं होता।',
   'sections':[
     {'heading':'एकादशी की पहचान','paragraphs':['एक चंद्रमास में सामान्यतः दो एकादशी तिथियाँ होती हैं: शुक्ल पक्ष की एकादशी और कृष्ण पक्ष की एकादशी। तिथि की गणना सूर्य और चंद्रमा के देशांतरों के आपसी अंतर से होती है।','पंचांग में एकादशी तिथि के साथ उसका समाप्ति समय भी देंखें, क्योंकि वह सूर्योदय के पहले या बाद में बदल सकती है।']},
     {'heading':'एकादशी व्रत का दिन क्यों बदल सकता है?','paragraphs':['विभिन्न वैष्णव तथा स्मार्त परंपराओं में दशमी-विद्धा एकादशी, द्वादशी, सूर्योदय तथा अन्य नियमों को ध्यान में रखा जा सकता है। इसी कारण दो कैलेंडर कभी एकादशी व्रत अलग दिनों में दिखा सकते हैं।','हमारी दैनिक तिथि सूची अपने आप व्रत का अंतिम निर्णय नहीं करती। जिस परंपरा का आप पालन करते हैं, उसी के अनुसार पुष्टि करें।']},
     {'heading':'पारण का अर्थ','paragraphs':['व्रत के समापन पर नियत तरीके से आहार ग्रहण करने की प्रक्रिया पारण कहलाती है। पारण का समय सामान्यतः द्वादशी और अन्य नियमों के अनुसार तय किया जाता है; यह हर दिन एक जैसा नहीं होता।','बिना स्थानीय व्रत नियमों की जाँच के कोई सार्वभौमिक पारण समय देना भ्रामक होगा, इसलिए यहाँ मनगढ़ंत समय प्रकाशित नहीं किया गया है।']},
     {'heading':'क्या करना चाहिए?','paragraphs':['व्रत रखने से पहले तिथि का आरंभ-अंत, व्रत दिवस और पारण की जाँच विश्वसनीय धार्मिक पंचांग से करें। स्वास्थ्य संबंधी स्थितियों में भोजन, पानी या दवा संबंधी आवश्यक सलाह को प्राथमिकता दें।']}
   ]
 },
 'tithi-kab-badalti-hai': {
   'name':'हिंदू तिथि कब बदलती है? आधी रात या सूर्योदय पर?',
   'intro':'एक तिथि सूर्योदय, दोपहर, शाम या रात किसी भी समय बदल सकती है। पंचांग में दिन की तिथि अलग नियम से बताई जाती है।',
   'sections':[
     {'heading':'तिथि बदलने की घड़ी','paragraphs':['तिथि सूर्य और चंद्रमा की आपसी निरयण दीर्घांश दूरी के हर 12 अंश पर बदलती है। इसलिए अंग्रेज़ी तारीख की तरह इसका कोई निश्चित आधी रात वाला समय नहीं है।','उदाहरण के लिए यदि चतुर्दशी रात 11:42 बजे तक है, तो उसके बाद पूर्णिमा तिथि शुरू हो सकती है। अगले दिन के सूर्योदय पर चल रही तिथि फिर अलग तरह से दैनिक पंचांग में दर्शाई जाएगी।']},
     {'heading':'पंचांग में सूर्योदय का महत्व','paragraphs':['बहुत-सी भारतीय पंचांग परंपराओं में सूर्योदय के समय चल रही तिथि को उस वार की तिथि कहा जाता है। यह केवल दैनिक परिचय का तरीका है, तिथि वास्तव में उसी समय शुरू होती हो, यह जरूरी नहीं।','विशिष्ट पर्व, व्रत और मुहूर्त के नियमों में सूर्योदय के अलावा प्रदोष, निशीथ या अन्य समय भी देखे जाते हैं।']},
     {'heading':'अपने शहर का समय क्यों देखें?','paragraphs':['चंद्र-सूर्य की आपसी कोणीय स्थिति से निकलने वाला तिथि-समाप्ति समय एक ही टाइम ज़ोन में सामान्यतः निकट होगा; लेकिन सूर्योदय अलग शहरों में अलग होता है। इसलिए सूर्योदय के समय उपस्थित तिथि शहर के अनुसार भिन्न हो सकती है।','तिथि दर्शन में भारतीय मानक समय (IST) और चुने हुए शहर के सूर्योदय का उपयोग किया जाता है।']},
     {'heading':'दैनिक उपयोग','paragraphs':['आज की तिथि और उसका समाप्ति समय साथ पढ़ें। अगले दिन के लिए चुने हुए शहर का पेज खोलें। त्योहार का दिन अलग से प्रमाणित धार्मिक कैलेंडर से पुष्टि करें।']}
   ]
 }
}

def dates_between(start,end):
    count=(end-start).days+1
    for i in range(count): yield start+timedelta(days=i)

def safe_json(data):
    return json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')

def date_page_path(city_slug,d):
    return f'/panchang/{city_slug}/{d.isoformat()}/'

def make_writer(site_url:str, today:date, start:date,end:date):
    sitemap=[]
    def write(route:str, html:str, indexable=True):
        path=DIST / route.lstrip('/') / 'index.html'
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(html,encoding='utf-8')
        if indexable:sitemap.append(route)
    def shared(title,description,route,page_type,selected_city='',selected_date='',schemas=None):
        canonical=site_url+route if site_url else None
        org={"@context":"https://schema.org","@type":"WebSite","name":"तिथि दर्शन","inLanguage":"hi-IN","description":"हिंदू पंचांग, आज की तिथि और शहर के अनुसार मुहूर्त","url":site_url+'/' if site_url else None}
        result=[safe_json({k:v for k,v in org.items() if v is not None})]
        if schemas:
            result.extend(safe_json(o) for o in schemas)
        return dict(title=title,description=description,canonical=canonical,page_type=page_type,selected_city=selected_city,selected_date=selected_date,build_year=today.year,schemas=result)
    return write,shared,sitemap

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--today',help='override Indian date as YYYY-MM-DD (for verification)')
    ap.add_argument('--days',type=int,help='demo: from today for number of days, plus yesterday')
    args=ap.parse_args()
    today=date.fromisoformat(args.today) if args.today else datetime.now(ZoneInfo('Asia/Kolkata')).date()
    if args.days:
        start=today-timedelta(days=1)
        end=today+timedelta(days=args.days-1)
    else:
        start=today-timedelta(days=7)
        end=today+timedelta(days=60)
    site_url=os.getenv('SITE_URL','').strip().rstrip('/')
    if site_url and not (site_url.startswith('https://') or site_url.startswith('http://localhost')):
        raise ValueError('SITE_URL must be a full HTTPS URL, e.g. https://your-site.pages.dev')
    # Keep the previously generated archive: crawled date URLs must not disappear.
    DIST.mkdir(parents=True,exist_ok=True)
    shutil.copytree(ROOT/'assets',DIST/'assets',dirs_exist_ok=True)
    write,shared,sitemap=make_writer(site_url,today,start,end)
    main_template=env.get_template('panchang.html')
    generated=0
    for d in dates_between(start,end):
        for city in CITIES:
            p=panchang_for(d,city)
            route=date_page_path(city['slug'],d)
            is_today=d==today
            desc=f"{p['dateHindi']} {p['city']} पंचांग: {p['paksha']} {p['tithi']} तिथि {p['tithiEnd']} तक; {p['nakshatra']} नक्षत्र, राहुकाल {p['rahu']['start']} से {p['rahu']['end']}।"
            title=f"{p['dateHindi']} {p['city']} पंचांग: {p['paksha']} {p['tithi']}, राहुकाल और मुहूर्त | तिथि दर्शन"
            schemas=[{'@context':'https://schema.org','@type':'WebPage','name':title,'inLanguage':'hi-IN','about':['हिंदू पंचांग','तिथि','मुहूर्त','राहुकाल'],'spatialCoverage':{'@type':'Place','name':city['english']+', India'}},
                     {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'मुखपृष्ठ','item':site_url+'/' if site_url else '/'},{'@type':'ListItem','position':2,'name':city['name'],'item':site_url+f"/shehar/{city['slug']}/" if site_url else f"/shehar/{city['slug']}/"},{'@type':'ListItem','position':3,'name':p['dateHindi'],'item':site_url+route if site_url else route}]}]
            page=main_template.render(**shared(title,desc,route,'date',city['slug'],p['date'],schemas),
                p=p,cities=CITIES,is_today=is_today,festival=FESTIVALS.get(d.isoformat()),
                previous_date=(d-timedelta(days=1)).isoformat() if d>start else None,next_date=(d+timedelta(days=1)).isoformat() if d<end else None,
                min_date=start.isoformat(),max_date=end.isoformat())
            write(route,page)
            generated+=1
            if is_today:
                city_route=f"/shehar/{city['slug']}/"
                city_title=f"आज {p['city']} में कौन सी तिथि है? {p['tithi']}, राहुकाल और शुभ मुहूर्त | तिथि दर्शन"
                city_desc=f"आज {p['city']} का पंचांग: {p['paksha']} {p['tithi']} ({p['tithiEnd']} तक), नक्षत्र {p['nakshatra']}, सूर्योदय {p['sunrise']} और राहुकाल {p['rahu']['start']} से {p['rahu']['end']}।"
                city_home=main_template.render(**shared(city_title,city_desc,city_route,'city',city['slug'],p['date'],schemas[:1]),
                    p=p,cities=CITIES,is_today=True,festival=FESTIVALS.get(d.isoformat()),
                    previous_date=(d-timedelta(days=1)).isoformat() if d>start else None,next_date=(d+timedelta(days=1)).isoformat() if d<end else None,
                    min_date=start.isoformat(),max_date=end.isoformat())
                write(city_route,city_home)
                if city['slug']=='delhi':
                    # This homepage has distinct canonical and title, unlike the indexed date URL.
                    home=main_template.render(**shared('आज कौन सी तिथि है? आज का पंचांग, शुभ मुहूर्त और राहुकाल | तिथि दर्शन',desc,'/','home',city['slug'],p['date'],schemas[:1]),
                        p=p,cities=CITIES,is_today=True,festival=FESTIVALS.get(d.isoformat()),
                        previous_date=(d-timedelta(days=1)).isoformat() if d>start else None,next_date=(d+timedelta(days=1)).isoformat() if d<end else None,
                        min_date=start.isoformat(),max_date=end.isoformat())
                    write('/',home)
    guide_links=[{'slug':slug,'name':g['name']} for slug,g in GUIDES.items()]
    info=env.get_template('info.html')
    for slug,g in GUIDES.items():
        route=f'/jankari/{slug}/'
        title=f"{g['name']} — सरल जानकारी, नियम और उदाहरण | तिथि दर्शन"
        desc=g['intro']
        schemas=[{'@context':'https://schema.org','@type':'Article','inLanguage':'hi-IN','headline':g['name'],'description':desc,'datePublished':'2026-11-23'}]
        write(route,info.render(**shared(title,desc,route,'guide',schemas=schemas),heading=g['name'],intro=g['intro'],sections=g['sections'],guide_links=guide_links))
    write('/shehar/',env.get_template('cities.html').render(**shared('भारत के शहरों का आज का पंचांग | तिथि दर्शन','दिल्ली, लखनऊ, हरदोई, वाराणसी और अन्य शहरों के लिए आज की तिथि एवं मुहूर्त देखें।','/shehar/','cities'),cities=CITIES))
    write('/vidhi/',env.get_template('method.html').render(**shared('पंचांग की गणना पद्धति और स्रोत | तिथि दर्शन','जानें तिथि, नक्षत्र, राहुकाल और अभिजीत मुहूर्त की गणना किस तरह की जाती है।','/vidhi/','method'),guide_links=guide_links))
    not_found=env.get_template('not-found.html').render(**shared('पेज नहीं मिला | तिथि दर्शन','यह पता उपलब्ध नहीं है।','/404/','not-found'))
    (DIST/'404.html').write_text(not_found,encoding='utf-8')
    (DIST/'_headers').write_text('/assets/*\n  Cache-Control: public, max-age=604800\n\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n',encoding='utf-8')
    # Avoid publishing a misleading placeholder sitemap if live site URL unknown.
    if site_url:
        # Include archived pages retained from earlier daily deployments.
        all_routes=sorted('/'+str(f.parent.relative_to(DIST)).replace(os.sep,'/').strip('/')+'/' if f.parent != DIST else '/' for f in DIST.rglob('index.html'))
        entries=''.join(f'<url><loc>{xmlutils.escape(site_url+route)}</loc></url>' for route in all_routes)
        (DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+entries+'</urlset>',encoding='utf-8')
    robots='User-agent: *\nAllow: /\n'
    if site_url:robots+=f'Sitemap: {site_url}/sitemap.xml\n'
    (DIST/'robots.txt').write_text(robots,encoding='utf-8')
    (DIST/'build-info.json').write_text(json.dumps({'indian_date':today.isoformat(),'range':{'start':start.isoformat(),'end':end.isoformat()},'cities':len(CITIES),'date_pages':generated,'sitemap':bool(site_url),'generated_at_utc':datetime.now(ZoneInfo('UTC')).isoformat(timespec='seconds')},indent=2),encoding='utf-8')
    print(f'Generated {generated} dated Panchang pages for {len(CITIES)} cities from {start} to {end}')
    print(f'Home page: {DIST}/index.html')
    print(f'Canonical/Sitemap configured: {bool(site_url)}')
    if not site_url:print('NOTE: SITE_URL is not configured. Set it to published URL for canonical links and sitemap.xml.')

if __name__=='__main__':main()
