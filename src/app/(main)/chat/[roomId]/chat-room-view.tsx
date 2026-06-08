<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Jomon Eats 🐕</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  :root{--g:#06c167;--ink:#0f0f0f;}
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  body{font-family:"Poppins","Noto Sans JP",-apple-system,sans-serif;background:#fff;color:var(--ink);
    max-width:480px;margin:0 auto;padding-bottom:90px;letter-spacing:.01em;}
  header{background:#fff;padding:14px 16px;position:sticky;top:0;z-index:1000;border-bottom:1px solid #f0f0f0;}
  .htop{display:flex;justify-content:space-between;align-items:center;}
  .brand{display:flex;align-items:center;gap:9px;}
  .brand img{width:36px;height:36px;border-radius:10px;object-fit:cover;background:#eee;}
  .brand .txt{font-family:"Poppins";font-size:21px;font-weight:800;letter-spacing:-.02em;}
  .brand .txt span{color:var(--g);}
  .badge{font-size:10px;background:#fff3e0;color:#e8590c;padding:4px 9px;border-radius:20px;font-weight:700;}
  .deliver-to{font-size:12px;color:#666;margin-top:10px;cursor:pointer;}
  .deliver-to b{color:var(--ink);font-weight:600;}
  .searchbar{margin-top:11px;background:#f4f4f4;border-radius:11px;padding:11px 13px;
    font-size:13px;color:#999;display:flex;align-items:center;gap:8px;}

  .screen{display:none;}.screen.active{display:block;}
  .back{background:none;border:none;color:var(--g);font-size:14px;cursor:pointer;
    margin:12px 0;padding:0 16px;font-weight:600;}

  .hero-logo{text-align:center;padding:26px 16px 6px;}
  .hero-logo img{width:96px;height:96px;border-radius:24px;object-fit:cover;box-shadow:0 6px 20px rgba(0,0,0,.12);}
  .hero-logo .title{font-family:"Poppins";font-size:27px;font-weight:800;margin-top:12px;letter-spacing:-.02em;}
  .hero-logo .title span{color:var(--g);}
  .hero-logo .tag{font-size:12px;color:#888;margin-top:4px;}

  .addr-box{background:#fff;border-radius:16px;padding:20px;margin:14px 16px;box-shadow:0 4px 18px rgba(0,0,0,.08);}
  .addr-box label{font-size:15px;font-weight:700;display:block;margin-bottom:6px;}
  .addr-hint{font-size:11px;color:#e8590c;background:#fff3e0;padding:7px 10px;border-radius:8px;margin-bottom:11px;font-weight:600;}
  .addr-box input{width:100%;padding:14px;border:1.5px solid #e4e4e4;border-radius:11px;font-size:14px;font-family:inherit;}
  .addr-box button{margin-top:13px;width:100%;background:var(--g);color:#fff;border:none;
    padding:15px;border-radius:11px;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit;}
  .addr-status{font-size:12px;margin-top:11px;}

  /* 宣伝バナー横スクロール */
  .promos{display:flex;gap:12px;overflow-x:auto;padding:16px 16px 4px;scrollbar-width:none;}
  .promos::-webkit-scrollbar{display:none;}
  .promo-card{flex:0 0 82%;border-radius:16px;padding:18px;color:#fff;position:relative;overflow:hidden;}
  .promo-card h3{font-size:17px;font-weight:800;letter-spacing:-.01em;}
  .promo-card p{font-size:12px;margin-top:6px;opacity:.95;line-height:1.5;}
  .promo-card .emoji{position:absolute;right:10px;bottom:-6px;font-size:56px;opacity:.5;}

  .cats{display:flex;gap:12px;overflow-x:auto;padding:16px;scrollbar-width:none;}
  .cats::-webkit-scrollbar{display:none;}
  .cat{flex:0 0 auto;text-align:center;font-size:12px;color:#444;cursor:pointer;font-weight:500;}
  .cat .ci{width:58px;height:58px;border-radius:50%;background:#f4f4f4;display:flex;
    align-items:center;justify-content:center;font-size:27px;margin-bottom:5px;transition:.15s;}
  .cat.on .ci{background:#e7f8ef;outline:2px solid var(--g);}

  .sec-title{font-size:19px;font-weight:800;padding:6px 16px 4px;letter-spacing:-.01em;}
  .sec-sub{font-size:12px;color:#888;padding:0 16px 12px;}

  .shop{margin:0 16px 20px;cursor:pointer;}
  .shop:active{opacity:.85;}
  .shop .img{height:155px;border-radius:16px;background-size:cover;background-position:center;
    position:relative;background-color:#eee;}
  .shop .promo{position:absolute;left:10px;top:10px;background:var(--g);color:#fff;
    font-size:11px;font-weight:700;padding:5px 9px;border-radius:7px;}
  .shop .fav{position:absolute;right:10px;top:10px;background:rgba(255,255,255,.92);
    width:31px;height:31px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;}
  .shop .nm{font-weight:700;font-size:17px;margin-top:9px;letter-spacing:-.01em;}
  .shop .mt{font-size:12px;color:#666;margin-top:4px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
  .shop .mt .star{color:var(--ink);font-weight:700;}

  .shop-hero{height:185px;background-size:cover;background-position:center;background-color:#eee;}
  .shop-head{padding:15px 16px;border-bottom:8px solid #f4f4f4;}
  .shop-head h2{font-size:23px;font-weight:800;letter-spacing:-.02em;}
  .shop-head .mt{font-size:12px;color:#666;margin-top:7px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  .menu-cat{font-size:16px;font-weight:800;padding:18px 16px 8px;}
  .menu-item{display:flex;justify-content:space-between;gap:13px;padding:15px 16px;
    border-bottom:1px solid #f4f4f4;cursor:pointer;}
  .menu-item:active{background:#fafafa;}
  .mi-info{flex:1;}
  .mi-name{font-weight:700;font-size:15px;}
  .mi-desc{font-size:12px;color:#777;margin-top:5px;line-height:1.55;}
  .mi-price{font-size:14px;font-weight:700;margin-top:7px;}
  .mi-img{width:98px;height:98px;border-radius:13px;background-size:cover;
    background-position:center;flex:0 0 auto;position:relative;background-color:#eee;}
  .mi-add{position:absolute;right:-6px;bottom:-6px;width:31px;height:31px;border-radius:50%;
    background:#fff;border:1px solid #e4e4e4;font-size:18px;font-weight:700;color:var(--g);
    display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);}

  .cartbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;
    max-width:480px;padding:12px 16px;display:none;z-index:1000;}
  .cartbar.show{display:block;}
  .cartbar .inner{background:var(--g);color:#fff;border-radius:13px;padding:16px 18px;
    display:flex;justify-content:space-between;align-items:center;font-weight:700;
    box-shadow:0 6px 18px rgba(6,193,103,.4);cursor:pointer;}
  .cartbar .cnt{background:#fff;color:var(--g);border-radius:7px;padding:2px 9px;font-size:13px;}

  .cart-line{display:flex;justify-content:space-between;align-items:center;padding:15px 16px;border-bottom:1px solid #f4f4f4;}
  .qty{display:flex;align-items:center;gap:13px;}
  .qty button{width:29px;height:29px;border-radius:50%;border:1.5px solid #e4e4e4;background:#fff;
    font-size:16px;cursor:pointer;color:var(--g);font-weight:700;font-family:inherit;}
  .coupon-box{margin:16px;background:#f7f7f7;border-radius:13px;padding:15px;}
  .coupon-box label{font-size:13px;font-weight:700;}
  .coupon-box select{width:100%;padding:12px;border:1.5px solid #e4e4e4;border-radius:9px;
    font-size:14px;margin-top:9px;background:#fff;font-family:inherit;}
  .breakdown{padding:8px 16px;}
  .price-row{display:flex;justify-content:space-between;font-size:14px;padding:5px 0;color:#444;}
  .price-row.total{font-size:18px;font-weight:800;color:var(--ink);border-top:1px solid #eee;margin-top:8px;padding-top:11px;}
  .order-btn{margin:16px;width:calc(100% - 32px);background:var(--g);color:#fff;border:none;
    padding:17px;border-radius:13px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;}
  .note{font-size:11px;color:#aaa;text-align:center;padding:0 16px 8px;}
  .sin{background:#fff3e0;color:#e8590c;font-size:12px;font-weight:700;text-align:center;padding:11px;margin:0 16px;border-radius:11px;}

  #mapTrack{height:240px;}
  .track-pad{padding:16px;}
  .eta{font-size:25px;font-weight:800;text-align:center;margin:15px 0 4px;letter-spacing:-.01em;}
  .eta-sub{font-size:12px;color:#888;text-align:center;margin-bottom:15px;}
  .steps{list-style:none;margin-top:8px;}
  .steps li{padding:14px;background:#f7f7f7;border-radius:11px;margin-bottom:8px;opacity:.45;font-size:14px;}
  .steps li.done{opacity:1;font-weight:700;background:#e7f8ef;}
  .steps li.done::before{content:"✅ ";}
  .rider-card{background:#fff;border:1px solid #eee;border-radius:15px;padding:14px;display:flex;align-items:center;margin:16px 0;}
  .rider-card .ava{width:52px;height:52px;border-radius:50%;object-fit:cover;margin-right:13px;background:#eee;}

  .confetti{position:fixed;top:-10px;font-size:20px;z-index:9999;animation:fall 2.5s linear forwards;}
  @keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:0;}}
</style>
</head>
<body>
<header>
  <div class="htop">
    <div class="brand">
      <img src="IMG_2764.jpeg" alt="logo" onerror="this.style.display='none'">
      <span class="txt">Jomon<span> Eats</span></span>
    </div>
    <span class="badge">請求 ¥0</span>
  </div>
  <div class="deliver-to" id="deliverTo" onclick="go('addr')">📍 お届け先を設定する ›</div>
  <div class="searchbar">🔍 食べたいものを探す（けど頼まない）</div>
</header>

<div id="addr" class="screen active">
  <div class="hero-logo">
    <img src="IMG_2764.jpeg" alt="logo" onerror="this.style.display='none'">
    <div class="title">Jomon<span> Eats</span></div>
    <div class="tag">頼んでも1円も減らない、背徳のフードデリバリー</div>
  </div>
  <div class="addr-box">
    <label>お届け先の住所を入力してください 🏠</label>
    <div class="addr-hint">⚠️ 番地（〇丁目〇番〇号）は書かないでください。「市区町村＋町名」まででOKです。</div>
    <input id="addrInput" placeholder="例：東京都新宿区西新宿" />
    <button onclick="setAddress()">この住所に届ける</button>
    <div class="addr-status" id="addrStatus"></div>
    <p style="font-size:11px;color:#aaa;margin-top:13px;line-height:1.7;">
      ※GPS・位置情報は取得しません。入力された住所から最寄り店舗を選びます。<br>
      ※実際の料理は届きません。お金も一切かかりません。背徳感だけ持ち帰ってください。</p>
  </div>
</div>

<div id="shops" class="screen">
  <div class="promos" id="promos"></div>
  <div class="cats" id="cats"></div>
  <div class="sec-title">近くのお店 🛵</div>
  <div class="sec-sub" id="shopsSub">最寄り順に表示中</div>
  <div id="shopList"></div>
</div>

<div id="menu" class="screen">
  <div class="shop-hero" id="shopHero"></div>
  <button class="back" onclick="go('shops')">← お店一覧へ</button>
  <div class="shop-head"><h2 id="shopName"></h2><div class="mt" id="shopMeta"></div></div>
  <div id="menuList"></div>
</div>

<div id="cart" class="screen">
  <button class="back" onclick="go('menu')">← メニューに戻る</button>
  <div class="sec-title">カート 🛒</div>
  <div id="cartItems"></div>
  <div class="coupon-box">
    <label>クーポン 🎟️</label>
    <select id="couponSelect" onchange="renderCart()">
      <option value="0">クーポンを使わない</option>
      <option value="300">初回限定 ¥300 OFF</option>
      <option value="500">深夜割 ¥500 OFF</option>
      <option value="free">送料無料クーポン</option>
    </select>
  </div>
  <div class="breakdown" id="priceBreakdown"></div>
  <div class="sin">💸 これだけ頼んでも、口座残高は1円も減りません</div>
  <button class="order-btn" onclick="placeOrder()">注文を確定する（無料）</button>
  <p class="note">背徳感はMAX、出費はゼロ。</p>
</div>

<div id="track" class="screen">
  <div id="mapTrack"></div>
  <div class="track-pad">
    <div class="eta" id="eta"></div>
    <div class="eta-sub" id="etaSub"></div>
    <div class="rider-card">
      <img class="ava" id="riderAva" alt="rider">
      <div><div id="riderName" style="font-weight:700;"></div>
        <div id="riderRate" style="font-size:12px;color:#777;"></div></div>
    </div>
    <ul class="steps" id="steps">
      <li>注文を受け付けました</li>
      <li>お店が調理を開始しました 🍳</li>
      <li>配達員が料理を受け取りました 🛵</li>
      <li>配達中です…もうすぐ到着 🏃</li>
      <li>配達完了！…という設定です 🎉</li>
    </ul>
    <button class="order-btn" style="margin:16px 0 0;width:100%;" onclick="reset()">もう一度ドーパミンを浴びる</button>
  </div>
</div>

<div class="cartbar" id="cartbar" onclick="go('cart')">
  <div class="inner"><span class="cnt" id="cartbarCount"></span>
    <span>カートを見る</span><span id="cartbarPrice"></span></div>
</div>

<script>
const W="https://upload.wikimedia.org/wikipedia/commons/thumb/";
// 宣伝バナー
const PROMOS=[
 {bg:"linear-gradient(135deg,#06c167,#04a056)",h:"深夜2時、いま142人が頼んだフリ中",p:"あなたも今夜、ノーカロリー・ノー出費で背徳に浸ろう。",e:"🛵"},
 {bg:"linear-gradient(135deg,#e8590c,#f08c00)",h:"初回クーポン ¥300 OFF",p:"どうせ請求¥0だけど、割引されると気持ちいい。",e:"🎟️"},
 {bg:"linear-gradient(135deg,#7048e8,#9c36b5)",h:"今夜の背徳ランキング1位：豚骨ラーメン",p:"みんな深夜に頼んだフリ。あなたは何にする？",e:"🍜"},
 {bg:"linear-gradient(135deg,#1098ad,#0c8599)",h:"送料無料クーポン配布中",p:"無料がさらに無料に。意味はないけど嬉しい。",e:"💸"},
];
const SHOPS=[
 {name:"夜中のラーメン横丁",cat:"ramen",time:"20-30分",rate:"4.8",rev:"1,204",lat:35.6938,lng:139.7034,
  hero:W+"5/5f/Tonkotsu_ramen_in_Tokyo.jpg/640px-Tonkotsu_ramen_in_Tokyo.jpg",promo:"深夜割対象",
  menu:[
   {n:"濃厚豚骨ラーメン",d:"12時間炊いた豚骨スープに極太麺。罪深い背脂たっぷり。",p:980,img:W+"5/5f/Tonkotsu_ramen_in_Tokyo.jpg/320px-Tonkotsu_ramen_in_Tokyo.jpg"},
   {n:"味玉つけ麺",d:"とろとろ味玉と魚介豚骨の濃厚つけ汁。〆まで背徳。",p:1080,img:W+"8/8d/Tsukemen_by_jetalone.jpg/320px-Tsukemen_by_jetalone.jpg"},
   {n:"焼き餃子6個",d:"パリッとジューシー。ビールが欲しくなる(けど頼めない)。",p:420,img:W+"0/0d/Gyoza_in_Japan.jpg/320px-Gyoza_in_Japan.jpg"},
   {n:"チャーシュー丼",d:"炙りチャーシューがご飯を覆い尽くす深夜の凶器。",p:550,img:W+"3/3a/Chashu_don.jpg/320px-Chashu_don.jpg"}]},
 {name:"バーガーパラダイス",cat:"burger",time:"15-25分",rate:"4.6",rev:"892",lat:35.6586,lng:139.7016,
  hero:W+"0/0b/RedDot_Burger.jpg/640px-RedDot_Burger.jpg",promo:"¥300 OFF対象",
  menu:[
   {n:"ベーコンチーズバーガー",d:"100%ビーフパティ2枚＋とろけるチェダー＋カリカリベーコン。",p:890,img:W+"0/0b/RedDot_Burger.jpg/320px-RedDot_Burger.jpg"},
   {n:"フライドポテトL",d:"揚げたてホクホク。塩は気持ち多め。深夜の正義。",p:380,img:W+"8/89/French_Fries.JPG/320px-French_Fries.JPG"},
   {n:"スパイシーナゲット10個",d:"外はサクッ中はジューシー。3種ソース付き。",p:520,img:W+"8/86/Chicken_McNuggets_%28cropped%29.jpg/320px-Chicken_McNuggets_%28cropped%29.jpg"},
   {n:"チョコシェイク",d:"濃厚すぎてストローが進まない背徳の一杯。",p:420,img:W+"2/2f/Chocolate_milkshake_%2818440544465%29.jpg/320px-Chocolate_milkshake_%2818440544465%29.jpg"}]},
 {name:"ピザ・ノッテ",cat:"pizza",time:"25-35分",rate:"4.7",rev:"1,560",lat:35.7295,lng:139.7109,
  hero:W+"9/91/Pizza-3007395.jpg/640px-Pizza-3007395.jpg",promo:"送料無料対象",
  menu:[
   {n:"マルゲリータ",d:"自家製モッツァレラとバジル。薪窯で焼いた本格ナポリ。",p:1480,img:W+"9/91/Pizza-3007395.jpg/320px-Pizza-3007395.jpg"},
   {n:"4種チーズ",d:"ゴルゴンゾーラ・モッツァレラ・パルメザン・チェダー。蜂蜜付き。",p:1680,img:W+"d/d3/Supreme_pizza.jpg/320px-Supreme_pizza.jpg"},
   {n:"ガーリックブレッド",d:"にんにくバターたっぷり。明日のことは考えない。",p:480,img:W+"5/5e/Garlic_bread.jpg/320px-Garlic_bread.jpg"},
   {n:"コーラ1.5L",d:"キンキンに冷えてます。ピザの相棒。",p:350,img:W+"4/41/Coca_Cola_Flasche_-_Original_Taste.jpg/320px-Coca_Cola_Flasche_-_Original_Taste.jpg"}]},
 {name:"中華大飯店 龍",cat:"chinese",time:"25-35分",rate:"4.5",rev:"1,033",lat:35.6580,lng:139.7966,
  hero:W+"3/39/Mapo_doufu_2.jpg/640px-Mapo_doufu_2.jpg",promo:"深夜割対象",
  menu:[
   {n:"麻婆豆腐",d:"花椒シビれる本格四川。白米が止まらない罪。",p:880,img:W+"3/39/Mapo_doufu_2.jpg/320px-Mapo_doufu_2.jpg"},
   {n:"チャーハン",d:"パラパラ卵チャーハン。深夜に食べる背徳の定番。",p:780,img:W+"8/8d/Yangzhou_fried_rice_by_yuen.jpg/320px-Yangzhou_fried_rice_by_yuen.jpg"},
   {n:"小籠包6個",d:"アツアツの肉汁がじゅわっと。やけど注意。",p:680,img:W+"3/3f/Xiaolongbao_cropped.jpg/320px-Xiaolongbao_cropped.jpg"},
   {n:"酢豚",d:"カリッと揚げた豚と甘酢あん。ご飯が進む。",p:980,img:W+"5/5b/Sweet_and_sour_pork.jpg/320px-Sweet_and_sour_pork.jpg"}]},
 {name:"寿司 海月",cat:"sushi",time:"30-40分",rate:"4.9",rev:"1,820",lat:35.6655,lng:139.7298,
  hero:W+"e/e5/Sushi_platter.jpg/640px-Sushi_platter.jpg",promo:"送料無料対象",
  menu:[
   {n:"特上にぎり10貫",d:"大トロ・うに・いくら入りの贅沢盛り。背徳の極み。",p:1980,img:W+"e/e5/Sushi_platter.jpg/320px-Sushi_platter.jpg"},
   {n:"サーモンいくら丼",d:"とろけるサーモンに弾けるいくら。罪深い丼。",p:1280,img:W+"6/6b/Ikura_gunkan.jpg/320px-Ikura_gunkan.jpg"},
   {n:"まぐろ赤身5貫",d:"赤身の旨み。シンプルゆえに止まらない。",p:880,img:W+"a/a4/Maguro_no_sushi.jpg/320px-Maguro_no_sushi.jpg"},
   {n:"茶碗蒸し",d:"出汁が効いたとろとろ茶碗蒸し。ほっとする一品。",p:380,img:W+"c/cd/Chawanmushi_by_Toshihiro_Gamo.jpg/320px-Chawanmushi_by_Toshihiro_Gamo.jpg"}]},
 {name:"韓国食堂 ソウル",cat:"korean",time:"25-35分",rate:"4.7",rev:"1,456",lat:35.7012,lng:139.7062,
  hero:W+"d/d2/Korean.food-Bibimbap-01.jpg/640px-Korean.food-Bibimbap-01.jpg",promo:"新規¥300 OFF",
  menu:[
   {n:"石焼きビビンバ",d:"ジュージュー音を立てるおこげが背徳。卵とコチュジャンで。",p:980,img:W+"d/d2/Korean.food-Bibimbap-01.jpg/320px-Korean.food-Bibimbap-01.jpg"},
   {n:"ヤンニョムチキン",d:"甘辛タレの韓国チキン。深夜に食べたら終わり。",p:1180,img:W+"4/47/Korean_fried_chicken_%28Yangnyeom%29.jpg/320px-Korean_fried_chicken_%28Yangnyeom%29.jpg"},
   {n:"トッポギ",d:"もちもち餅に激辛ソース。クセになる罪の味。",p:680,img:W+"0/05/Korean.snack-Tteokbokki-01.jpg/320px-Korean.snack-Tteokbokki-01.jpg"},
   {n:"チーズキンパ",d:"のり巻きにとろけるチーズ。背徳のコラボ。",p:780,img:W+"8/83/Gimbap_%28cropped%29.jpg/320px-Gimbap_%28cropped%29.jpg"}]},
 {name:"深夜カフェ Lumo",cat:"cafe",time:"15-25分",rate:"4.6",rev:"742",lat:35.6620,lng:139.6986,
  hero:W+"7/79/Cheesecake.jpg/640px-Cheesecake.jpg",promo:"¥300 OFF対象",
  menu:[
   {n:"カフェラテ",d:"ふんわりミルクと深煎りエスプレッソ。夜更かしの相棒。",p:520,img:W+"c/c8/Cafe_Latte_at_Pulse_Cafe.jpg/320px-Cafe_Latte_at_Pulse_Cafe.jpg"},
   {n:"ベルギーワッフル",d:"外サクッ中ふわっ。生クリームとメープルで罪深く。",p:680,img:W+"7/74/Waffles_with_Strawberries.jpg/320px-Waffles_with_Strawberries.jpg"},
   {n:"ニューヨークチーズケーキ",d:"濃厚なめらか。深夜の自分へのご褒美(無料)。",p:620,img:W+"7/79/Cheesecake.jpg/320px-Cheesecake.jpg"},
   {n:"アイスカフェモカ",d:"チョコとコーヒーの誘惑。カロリーは気にしない。",p:580,img:W+"6/64/Iced_coffee_with_cream.jpg/320px-Iced_coffee_with_cream.jpg"}]},
 {name:"スイーツ深夜便",cat:"sweets",time:"20-30分",rate:"4.9",rev:"2,031",lat:35.6705,lng:139.7649,
  hero:W+"2/29/Chocolate_cake_with_chocolate_frosting_topped_with_chocolate.jpg/640px-Chocolate_cake_with_chocolate_frosting_topped_with_chocolate.jpg",promo:"新規¥300 OFF",
  menu:[
   {n:"生チョコケーキ",d:"口どけ濃厚。深夜に食べる背徳の王様。",p:680,img:W+"2/29/Chocolate_cake_with_chocolate_frosting_topped_with_chocolate.jpg/320px-Chocolate_cake_with_chocolate_frosting_topped_with_chocolate.jpg"},
   {n:"いちごパフェ",d:"生クリームとアイスと苺の暴力。罪の味。",p:780,img:W+"7/7c/Strawberry_parfait.jpg/320px-Strawberry_parfait.jpg"},
   {n:"焼きたてプリン",d:"ほろ苦カラメルととろける卵。背徳の定番。",p:450,img:W+"a/a5/Creme_caramel.jpg/320px-Creme_caramel.jpg"},
   {n:"いちごクレープ",d:"もちもち生地にたっぷりクリーム。",p:520,img:W+"f/f0/Cr%C3%AApe_with_strawberries_and_cream.jpg/320px-Cr%C3%AApe_with_strawberries_and_cream.jpg"}]},
 {name:"アサイーボウル専門 AÇAÍ",cat:"acai",time:"15-25分",rate:"4.8",rev:"965",lat:35.6646,lng:139.7106,
  hero:W+"5/5e/Acai_bowl_%2843779425762%29.jpg/640px-Acai_bowl_%2843779425762%29.jpg",promo:"新規¥300 OFF",
  menu:[
   {n:"定番アサイーボウル",d:"濃厚アサイーにグラノーラとバナナ。罪悪感ゼロ(に見える)。",p:980,img:W+"5/5e/Acai_bowl_%2843779425762%29.jpg/320px-Acai_bowl_%2843779425762%29.jpg"},
   {n:"ベリーミックスボウル",d:"ブルーベリーといちごをどっさり。映える背徳。",p:1080,img:W+"5/5e/Acai_bowl_%2843779425762%29.jpg/320px-Acai_bowl_%2843779425762%29.jpg"},
   {n:"トロピカルボウル",d:"マンゴーとパイナップルで南国気分。",p:1180,img:W+"5/5e/Acai_bowl_%2843779425762%29.jpg/320px-Acai_bowl_%2843779425762%29.jpg"},
   {n:"プロテインスムージー",d:"トレーニング後の自分へ(運動はしてない)。",p:780,img:W+"6/64/Iced_coffee_with_cream.jpg/320px-Iced_coffee_with_cream.jpg"}]},
 {name:"讃岐うどん 凪",cat:"udon",time:"20-30分",rate:"4.7",rev:"1,302",lat:35.6912,lng:139.7000,
  hero:W+"7/72/Ise_udon_by_hirotomo.jpg/640px-Ise_udon_by_hirotomo.jpg",promo:"深夜割対象",
  menu:[
   {n:"釜玉うどん",d:"熱々麺に生卵をからめて。シンプルゆえの背徳。",p:580,img:W+"7/72/Ise_udon_by_hirotomo.jpg/320px-Ise_udon_by_hirotomo.jpg"},
   {n:"カレーうどん",d:"スパイシーな出汁カレー。服を汚す覚悟で。",p:780,img:W+"a/ac/Curry_udon_by_yoppy.jpg/320px-Curry_udon_by_yoppy.jpg"},
   {n:"ぶっかけうどん",d:"コシのある冷たい麺に濃いめのつゆ。",p:620,img:W+"7/72/Ise_udon_by_hirotomo.jpg/320px-Ise_udon_by_hirotomo.jpg"},
   {n:"天ぷら盛り合わせ",d:"サクサク衣の海老と野菜。うどんの相棒。",p:680,img:W+"8/89/French_Fries.JPG/320px-French_Fries.JPG"}]},
 {name:"鍋処 ぬくもり",cat:"nabe",time:"30-40分",rate:"4.9",rev:"880",lat:35.6730,lng:139.7600,
  hero:W+"a/ad/Sukiyaki_01.jpg/640px-Sukiyaki_01.jpg",promo:"送料無料対象",
  menu:[
   {n:"すき焼き鍋",d:"甘辛割り下に霜降り牛。卵にくぐらせる背徳の儀式。",p:1880,img:W+"a/ad/Sukiyaki_01.jpg/320px-Sukiyaki_01.jpg"},
   {n:"もつ鍋",d:"プリプリもつとニラの旨み。〆まで罪。",p:1480,img:W+"a/ad/Sukiyaki_01.jpg/320px-Sukiyaki_01.jpg"},
   {n:"キムチ鍋",d:"ピリ辛で体ぽかぽか。汗かいて背徳を流す。",p:1280,img:W+"a/ad/Sukiyaki_01.jpg/320px-Sukiyaki_01.jpg"},
   {n:"〆のうどん",d:"鍋の旨みを吸ったうどん。これが本命。",p:380,img:W+"7/72/Ise_udon_by_hirotomo.jpg/320px-Ise_udon_by_hirotomo.jpg"}]},
];
const CATS=[{k:"all",e:"🍽️",l:"すべて"},{k:"ramen",e:"🍜",l:"ラーメン"},{k:"burger",e:"🍔",l:"バーガー"},
 {k:"pizza",e:"🍕",l:"ピザ"},{k:"chinese",e:"🥟",l:"中華"},{k:"sushi",e:"🍣",l:"寿司"},
 {k:"korean",e:"🌶️",l:"韓国"},{k:"cafe",e:"☕",l:"カフェ"},{k:"acai",e:"🍓",l:"アサイー"},
 {k:"udon",e:"🍲",l:"うどん"},{k:"nabe",e:"🍢",l:"鍋"},{k:"sweets",e:"🍰",l:"スイーツ"}];
const RIDERS=[
 {name:"タナカ ケンジ",img:"https://randomuser.me/api/portraits/men/32.jpg",rate:"⭐ 4.9 ・ 配達3,200回"},
 {name:"スズキ ミサキ",img:"https://randomuser.me/api/portraits/women/44.jpg",rate:"⭐ 4.8 ・ 配達1,870回"},
 {name:"サトウ リク",img:"https://randomuser.me/api/portraits/men/65.jpg",rate:"⭐ 5.0 ・ 配達5,540回"},
 {name:"イトウ ハルカ",img:"https://randomuser.me/api/portraits/women/68.jpg",rate:"⭐ 4.7 ・ 配達980回"},
 {name:"ヤマモト ダイチ",img:"https://randomuser.me/api/portraits/men/12.jpg",rate:"⭐ 4.9 ・ 配達4,110回"}];

let cart=[],currentShop=null,home=null,curCat="all";

function distKm(a,b){const R=6371,t=x=>x*Math.PI/180;
 const dLa=t(b.lat-a.lat),dLn=t(b.lng-a.lng);
 const s=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLn/2)**2;
 return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function deliveryFee(km){return Math.min(800,Math.max(250,Math.round(km*150/10)*10));}
function go(id){if(id==='cart')renderCart();
 document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
 document.getElementById(id).classList.add('active');window.scrollTo(0,0);}

async function setAddress(){
 const q=document.getElementById('addrInput').value.trim();
 const st=document.getElementById('addrStatus');
 if(!q){st.textContent="住所を入力してね";st.style.color="#c33";return;}
 st.textContent="住所を確認中…";st.style.color="#777";
 try{
  const gsi=`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`;
  const res=await fetch(gsi);const d=await res.json();
  if(d&&d.length){const c=d[0].geometry.coordinates;home={lat:c[1],lng:c[0],addr:q};onAddressOk(q);return;}
 }catch(e){}
 try{
  const url=`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&q=${encodeURIComponent(q)}`;
  const res=await fetch(url,{headers:{'Accept-Language':'ja'}});const d=await res.json();
  if(d.length){home={lat:parseFloat(d[0].lat),lng:parseFloat(d[0].lon),addr:q};onAddressOk(q);return;}
 }catch(e){}
 st.textContent="住所が見つかりませんでした。番地を省いて『市区町村＋町名』で試してみてね。";st.style.color="#c33";
}
function onAddressOk(q){
 const st=document.getElementById('addrStatus');
 st.textContent="お届け先を設定しました ✅";st.style.color="var(--g)";
 document.getElementById('deliverTo').innerHTML=`📍 お届け先：<b>${q}</b> ›`;
 renderPromos();renderCats();renderShops();go('shops');
}

function renderPromos(){document.getElementById('promos').innerHTML=PROMOS.map(p=>`
 <div class="promo-card" style="background:${p.bg}">
  <h3>${p.h}</h3><p>${p.p}</p><span class="emoji">${p.e}</span></div>`).join('');}
function renderCats(){document.getElementById('cats').innerHTML=CATS.map(c=>`
 <div class="cat ${c.k===curCat?'on':''}" onclick="selCat('${c.k}')">
  <div class="ci">${c.e}</div><div>${c.l}</div></div>`).join('');}
function selCat(k){curCat=k;renderCats();renderShops();}

function renderShops(){
 let list=SHOPS.map((s,i)=>({s,i})).filter(o=>curCat==='all'||o.s.cat===curCat);
 if(home){list.forEach(o=>o.km=distKm(home,o.s));list.sort((a,b)=>a.km-b.km);}
 document.getElementById('shopsSub').textContent=home?`📍 ${home.addr} から最寄り順`:'最寄り順に表示中';
 document.getElementById('shopList').innerHTML=list.map(o=>`
  <div class="shop" onclick="openShop(${o.i})">
   <div class="img" style="background-image:url('${o.s.hero}')">
    <span class="promo">${o.s.promo}</span><span class="fav">🤍</span></div>
   <div class="nm">${o.s.name}</div>
   <div class="mt"><span class="star">⭐ ${o.s.rate}</span><span>(${o.s.rev}件)</span>
    <span>・ ${o.s.time}</span>${home?`<span>・ 📍${o.km.toFixed(1)}km</span><span>・ 配達料¥${deliveryFee(o.km)}</span>`:''}</div>
  </div>`).join('');
}
function openShop(i){
 currentShop=SHOPS[i];currentShop._km=home?distKm(home,currentShop):2;
 document.getElementById('shopHero').style.backgroundImage=`url('${currentShop.hero}')`;
 document.getElementById('shopName').textContent=currentShop.name;
 document.getElementById('shopMeta').innerHTML=
  `<span class="star">⭐ ${currentShop.rate} (${currentShop.rev}件)</span><span>・ ${currentShop.time}</span>
   <span>・ 📍${currentShop._km.toFixed(1)}km</span><span>・ 配達料¥${deliveryFee(currentShop._km)}</span>`;
 document.getElementById('menuList').innerHTML=`<div class="menu-cat">人気メニュー 🔥</div>`+
  currentShop.menu.map((m,j)=>`
  <div class="menu-item" onclick="addToCart(${j})">
   <div class="mi-info"><div class="mi-name">${m.n}</div>
    <div class="mi-desc">${m.d}</div><div class="mi-price">¥${m.p}</div></div>
   <div class="mi-img" style="background-image:url('${m.img}')"><div class="mi-add">＋</div></div>
  </div>`).join('');
 go('menu');
}
function addToCart(j){const m=currentShop.menu[j];const f=cart.find(c=>c.n===m.n);
 if(f)f.q++;else cart.push({...m,q:1,shop:currentShop.name});updateCartBar();burst(1);}
function changeQty(name,d){const it=cart.find(c=>c.n===name);if(!it)return;
 it.q+=d;if(it.q<=0)cart=cart.filter(c=>c.n!==name);updateCartBar();renderCart();}
function calcTotal(){
 const subtotal=cart.reduce((a,c)=>a+c.p*c.q,0);const km=currentShop?currentShop._km:2;
 const fee=deliveryFee(km);
 const cv=document.getElementById('couponSelect')?document.getElementById('couponSelect').value:"0";
 let discount=0,feeAfter=fee;if(cv==='free')feeAfter=0;else discount=parseInt(cv)||0;
 const service=Math.round(subtotal*0.05);let total=subtotal+feeAfter+service-discount;if(total<0)total=0;
 return{subtotal,fee,feeAfter,service,discount,total,km};}
function updateCartBar(){const count=cart.reduce((a,c)=>a+c.q,0);const bar=document.getElementById('cartbar');
 if(count>0){bar.classList.add('show');document.getElementById('cartbarCount').textContent=count;
  document.getElementById('cartbarPrice').textContent=`¥${calcTotal().total.toLocaleString()}`;}
 else bar.classList.remove('show');}
function renderCart(){const el=document.getElementById('cartItems');
 if(cart.length===0){el.innerHTML="<p style='padding:16px;color:#888;'>カートは空です</p>";}
 else el.innerHTML=cart.map(c=>`
  <div class="cart-line"><div><div style="font-weight:700;">${c.n}</div>
   <div style="font-size:12px;color:#888;">¥${c.p} ・ ${c.shop}</div></div>
   <div class="qty"><button onclick="changeQty('${c.n}',-1)">−</button>
   <span>${c.q}</span><button onclick="changeQty('${c.n}',1)">＋</button></div></div>`).join('');
 const t=calcTotal();
 document.getElementById('priceBreakdown').innerHTML=`
  <div class="price-row"><span>商品小計</span><span>¥${t.subtotal.toLocaleString()}</span></div>
  <div class="price-row"><span>配達料（${t.km.toFixed(1)}km）</span><span>${t.feeAfter===0?'<s style="color:#aaa;">¥'+t.fee+'</s> ¥0':'¥'+t.fee}</span></div>
  <div class="price-row"><span>サービス料</span><span>¥${t.service.toLocaleString()}</span></div>
  ${t.discount?`<div class="price-row" style="color:var(--g);"><span>クーポン割引</span><span>-¥${t.discount}</span></div>`:''}
  <div class="price-row total"><span>合計</span><span>¥${t.total.toLocaleString()} <small style="color:var(--g);">（請求¥0）</small></span></div>`;
}
function placeOrder(){if(cart.length===0){alert("カートが空だよ！");return;}
 burst(60);const r=RIDERS[Math.floor(Math.random()*RIDERS.length)];
 document.getElementById('riderName').textContent=r.name;
 document.getElementById('riderAva').src=r.img;
 document.getElementById('riderRate').textContent=r.rate;
 go('track');startTracking();}

let map=null,riderMarker=null,trackTimer=null;
function startTracking(){
 const steps=document.querySelectorAll('#steps li');steps.forEach(s=>s.classList.remove('done'));
 const eta=document.getElementById('eta'),etaSub=document.getElementById('etaSub');
 if(map){map.remove();map=null;}
 map=L.map('mapTrack');
 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);
 const shopPt=[currentShop.lat,currentShop.lng],homePt=[home.lat,home.lng];
 L.marker(shopPt).addTo(map).bindPopup('🏪 '+currentShop.name);
 L.marker(homePt).addTo(map).bindPopup('🏠 お届け先');
 const line=L.polyline([shopPt,homePt],{color:'#06c167',weight:4,dashArray:'8'}).addTo(map);
 map.fitBounds(line.getBounds().pad(0.3));
 riderMarker=L.marker(shopPt,{icon:L.divIcon({html:'🛵',className:'',iconSize:[30,30]})}).addTo(map);
 let i=0,minutes=Math.max(8,Math.round(currentShop._km*4)+10);
 eta.textContent=`到着まで約 ${minutes} 分`;etaSub.textContent=`${currentShop.name} が調理を始めます`;
 clearInterval(trackTimer);
 trackTimer=setInterval(()=>{
  if(i<steps.length){steps[i].classList.add('done');const p=i/(steps.length-1);
   riderMarker.setLatLng([currentShop.lat+(home.lat-currentShop.lat)*p,currentShop.lng+(home.lng-currentShop.lng)*p]);
   i++;minutes=Math.max(0,minutes-Math.ceil(minutes/2));
   eta.textContent=i>=steps.length?"到着しました！🎉":`到着まで約 ${minutes} 分`;
   etaSub.textContent=i>=steps.length?"…でも、何も届きません。背徳感だけどうぞ。":"配達員が向かっています";
   if(i>=steps.length){clearInterval(trackTimer);burst(40);}}
 },1800);
 setTimeout(()=>map.invalidateSize(),200);
}
function burst(n){const ch=["🎉","✨","🍔","🍕","🍜","🥳","💸","🛵"];
 for(let k=0;k<n;k++){const c=document.createElement('div');c.className='confetti';
  c.textContent=ch[Math.floor(Math.random()*ch.length)];c.style.left=Math.random()*100+"vw";
  c.style.animationDelay=(Math.random()*0.4)+"s";c.style.fontSize=(14+Math.random()*20)+"px";
  document.body.appendChild(c);setTimeout(()=>c.remove(),3000);}}
function reset(){cart=[];currentShop=null;
 if(document.getElementById('couponSelect'))document.getElementById('couponSelect').value="0";
 updateCartBar();go('shops');}
renderPromos();renderCats();renderShops();
</script>
</body>
</html>
