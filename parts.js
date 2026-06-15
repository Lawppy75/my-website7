//画像のリスト
let haikei = document.getElementsByClassName("haikei")
let box = document.getElementsByClassName("box")
let msg = document.getElementsByClassName("msg")

//効果音のリスト
let oto = []

//固定データ（変わらないデータ）
let window1 = { sx:640, sy:480 } //ウィンドウの大きさ(横とたての長さ)
let timerno //タイマー制御用
let timerv = 30 //ゲームの実行タイマー値(小さいと速い)
let canvas //キャンバス
let sspeed = 2 //スクロールの速度(1回の移動ドット数)
let boxs = { x:125, y:35 } //箱画像の大きさ
let drones = { x:128, y:128 } //ドローン画像の大きさ
let dronei = { x:window1.sx / 2, y:window1.sy - drones.y / 2 } //ドローンの初期位置(中央座標が画面下中央)
let dronespeed = [15, 5] //ドローンの移動速度(1回の移動ドット数、[0]は箱無し時、[1]は箱有り時)
let targetnum = 20 //配達先の数
let targets = { x:90, y:90 } //配達先の大きさ
let targeti = { x:116 + targets.x / 2, y:-targets.y / 2 } //配達先の初期位置(xはこの値と乱数で決まる5の倍数)
let targetti = 480 //次の配達先が現れるまでの時間の初期値
let targettm = 2 //次の配達先が現れるまでの時間の減少量
let boxnum = 40 //箱の数
let dropy = 17 //ドローンのY座標と目印のY座標の差
let dronenums = 3 //ドローンの数の初期値
let maxx = Math.floor((targets.x + boxs.x * 0.4) / 2) //配達先とおろした箱(元の40%大)のX座標差の最大値
let maxy = Math.floor((targets.y + boxs.y * 0.4) / 2) //配達先とおろした箱(元の40%大)のY座標差の最大値

//作業データ（ゲームの状態によって値が変わります）
let ctx //画像などをえがくためのしかけの入り口
let timer = timerv //ゲームの実行タイマー
let mode = 0 //ゲームの状態（ 0:タイトルモード,5:プレイモード,6:箱補給モード,9:ゲームオーバーモード,10:クリアモード）
let haikeiy = 0 //はいけい画像[1]のつなぎめのy座標
let dronexy = { x:dronei.x, y:dronei.y } //ドローンの位置
let dronemode = 0 //ドローンの状態(0:箱なし, 1:箱あり)
let onbox = 0 //ドローンに乗っている箱の番号
let target = [] //配達先のリスト
let targett = targetti //次の配達先が現れるまでの時間
let targetnext = targett //次の配達先が現れるまでの残り時間
let boxlist = [] //箱のリスト
let score = 0 //スコア
let hiscore = [0, 0, 0] //ハイスコア(3位まで)
let dronenum = dronenums //ドローンの数
let kaze = 0 //風(-2～2)
let sakurax = 0 //さくら画像のつなぎめのx座標
let bgfx = 0 //背景演出(0:haikei1, 1:haikei2, 2:haikei3, 3:fire)
let bgfxt = 0 //背景演出の残り時間(ミリ秒)
let firetarget = -1 //fire.pngを表示する配達先の番号
let keysPressed = { 37:false, 38:false, 39:false, 40:false } //押されているキーの状態(37:←, 38:↑, 39:→, 40:↓)
let keySoundTimer = { 37:0, 38:0, 39:0, 40:0 } //キー音声の再生タイマー
let endvideotime = 0 //終了動画の表示時間

//最初に１回だけやること（起動処理）
function init() {
    canvas = document.getElementById('canvas') //キャンバスを得る
    ctx = canvas.getContext('2d') //キャンバスの情報（コンテキスト）を得る
    addEventListener('keydown', keyDown, true) //キーをおし終えた時にやることを示す
    addEventListener('keyup', keyUp, true) //キーがおされた時にやることを示す
    for (let i = 0; i < targetnum; i++) { //配達先の数だけくり返す
        target[i] = { e:0, x:targeti.x, y:targeti.y, on:0 } //配達先のリストを作る(e=0:無し/1:有り, x,y=中心の座標, on=0:箱無し/1:箱有り)
    }
    for (let i = 0; i < boxnum; i++) { //箱の数だけくり返す
        boxlist[i] =  { e:0, n:0, x:dronexy.x, y:dronexy.y + boxs.y / 2, s:1, p:0 } //箱のリストを作る(e=0:無し/1:有り/2~5:おろす/6~20:補給, n=種類, x,y=中心の座標, s=倍率, p:ポイント)
    }
    let startvideo = document.getElementById("startvideo") //開始動画を得る
    startvideo.play() //開始動画を流す
    setTimeout(function() { //2秒後に
        startvideo.style.display = "none" //開始動画を隠す
        start() //開始処理を呼ぶ
    }, 2000)
}

//はいけい画像のつなぎ目をスクロールの分だけ下げた座標を求める
function haikeirenketsu(y) {
    if (y < window1.sy) { //はいけい画像[1]のつなぎ目のy座標が下端より上なら
        return y + sspeed //つなぎめのy座標にスクロールの分を加えることでつなぎ目を下げた座標を返す
    } else { //つなぎ目が画面の下端なら
        return 0 //画面の上端に戻すようにゼロを返す
    }
}

//おされた矢印キーに応じてドローンの位置を上下左右に動かす
function movedrone(key, xx, yy) {
    let xy = { x:xx, y:yy }
    if (key === 37 && xy.x >= drones.x) { //←キーがおされステージの左端ではなかったら
        xy.x = xy.x - dronespeed[dronemode] //ドローンを左に動かす
    }
    if (key === 38 && xy.y >= drones.y / 2) { //↑キーがおされステージの上端ではなかったら
        xy.y = xy.y - dronespeed[dronemode] //ドローンを上に動かす
    }
    if (key === 39 && xy.x < window1.sx - drones.x) { //→キーがおされステージの右端ではなかったら
        xy.x = xy.x + dronespeed[dronemode] //ドローンを右に動かす
    }
    if (key === 40 && xy.y < window1.sy - drones.y / 2) { //↓キーがおされステージの下端ではなかったら
        xy.y = xy.y + dronespeed[dronemode] //ドローンを下に動かす
    }
    return xy
}

//配達先[i]をスクロールに合わせて動かす
function targetmove(i) {
    if (target[i].y < window1.sy + targets.y) { //配達先[i]のy座標が下端より上なら
        target[i].y = target[i].y + sspeed //配達先[i]をスクロールに合わせて下へ動かす
    } else { //画面の下端なら
        target[i].e = 0 //配達先[i]を無しにする
    }
}

//条件がそろったら次の配達先を出す
function nexttarget() {
    targetnext = targetnext - targettm //次の配達先が現れるまでの残り時間を減らす
    if (targetnext <= 0) { //次の配達先が現れるまでの残り時間がゼロならば
        for (let i = 0; i < targetnum; i++) { //配達先の数だけくり返す
            if (target[i].e === 0) { //配達先[i]が無ければ
                target[i].e = 1 //有りにする
                target[i].x = Math.floor(((Math.random() * (window1.sx - targeti.x * 2)) + targeti.x) / 5) * 5 //X位置を乱数で決める(5単位)
                target[i].y = -targets.y / 2 //Yは初期位置にする
                target[i].on = 0 //箱無しにする
                break //くり返しを抜ける
            }
        }
        targetnext = targett //次の配達先が現れるまでの残り時間をセットする
    }
}

//配達先が少しずつ早く現れるようにする
function targetspeedup() {
    if (haikeiy === 0 && targett > targetti / 3) {  //はいけい画像[1]のつなぎめが上端で、次の配達先が現れるまでの時間が初期値の1/3超なら
        return targett - targettm * 10 //次の配達先が現れるまでの時間を毎回の減少量の10倍だけ減らす
    } else {
        return targett
    }
}

//箱[n]を(x,y)を中心にm倍で表示
function drawbox(n, x, y, m=1) {
    let sx = Math.floor(boxs.x * m) //箱の大きさに倍率を掛けて小数点以下を切り捨てて表示のXサイズを求める
    let sy = Math.floor(boxs.y * m) //箱の大きさに倍率を掛けて小数点以下を切り捨てて表示のYサイズを求める
    ctx.drawImage(box[n], x - sx / 2, y - sy / 2, sx, sy) //箱画像を表示
}

//ドローンを(x,y)を中心に表示
function drawdrone(x, y) {
    ctx.drawImage(drone, x - drones.x / 2, y - drones.y / 2) //ドローン画像を表示
}

//配達先[n]を表示
function drawtarget(n) {
    ctx.drawImage(target0, target[n].x - targets.x / 2, target[n].y - targets.y / 2) //配達先画像を表示
}

//次の箱があれば用意して箱補給モードにする
function getnextbox() {
    let flag = false //箱を有りにできたかのフラグ
    for (let i = 0; i < boxnum; i++) { //箱の数だけくり返す
        if (boxlist[i].e === 0) { //箱[i]が無ければ
            onbox = i //箱のi番がドローンに乗っているとする
            boxlist[i].e = 6 //箱[i]を補給中にする
            flag = true
            return 6 //箱補給モードを返す
        }
    }
    return mode //補給できる箱がないのでモードをそのまま返す
}

//箱[i]がおろしている状態ならばスクロールに合わせて下へ動かす
function movedropedbox(i) {
    if (boxlist[i].e >= 2 && boxlist[i].e <= 5) { //箱[i]をおろしているなら
        boxlist[i].y = boxlist[i].y + sspeed //箱[i]をスクロールに合わせて動かす
    }
}

//箱[i]がおろしている途中ならば状態を1つ進める
function boxdroping(i) {
    if (boxlist[i].e >= 2 && boxlist[i].e <= 4) { //箱[i]をおろしている途中なら
        boxlist[i].e = boxlist[i].e + 1 //状態を1つ進める
    }
}

//箱[i]がおろしている状態で見えなくなったら消す
function removebox(i) {
    if (boxlist[i].y > window1.sy + boxs.y && boxlist[i].e <= 5) { //おろしている箱[i]が画面下部に消えていたら
        boxlist[i].e = 0 //箱[i]をなしにする
    }
}

//次の箱をドローンへ補給し、完了したらプレイモードにする
function dropnextbox() {
    boxlist[onbox].e = boxlist[onbox].e + 1 //箱補給の状態を1進める
    if (boxlist[onbox].e >= 20) { //箱補給が完了したら
        dronemode = 1 //ドローンに箱有りにする
        boxlist[onbox].e = 1 //補給した箱を「有り」にする
        return 5 //プレイモードにする
    } else {
        return 6 //箱補給モードのままにする
    }
}

//スコアを表示
function drawscore(myscore) {
    ctx.font = '24pt Arial' //文字サイズを指定
    ctx.fillStyle = 'black' //黒色に設定
    ctx.fillText(("000000" + myscore).slice(-6), 530, 32) //スコアを6桁で表示
}

//おろした箱が配達先の中央に近いかどうかでポイントを求める
function getpoint(mybox, mytarget) {
    let x = Math.abs(boxlist[mybox].x - target[mytarget].x) //箱と配達先のX座標差
    let y = Math.abs(boxlist[mybox].y - target[mytarget].y) //箱と配達先のY座標差
    if (x < maxx && y < maxy) { //おろした箱が配達先と重なっていたら
        return 50 - Math.floor((x + y) * 50 / (maxx + maxy)) //箱と配達先の座標差に応じてポイントを求めて返す
    } else {
        return 0 //重なっていないのでゼロを返す
    }
}

//ポイントを表示
function drawpoint(mybox) {
    ctx.font = '24pt Arial' //文字サイズを指定
    ctx.fillStyle = 'white' //白色に設定
    ctx.fillText(("00" + boxlist[mybox].p).slice(-2), boxlist[mybox].x - 16, boxlist[mybox].y - 16) //ポイントを2桁で表示
}

//ゲームオーバーを表示
function drawgameover() {
    ctx.font = '80pt Arial' //文字サイズを指定
    ctx.fillStyle = 'Black' //文字を黒色に
    ctx.fillText('Game Over', 40, 258) //文字列'Game Over'を表示
    ctx.fillStyle = 'Orange' //文字をオレンジ色に
    ctx.fillText('Game Over', 42, 260) //文字列'Game Over'を表示
}

//ハイスコアの更新
function hiscoreupdate(myscore) {
    if (hiscore[2] < myscore) { //ランクイン（現在の最下位より大）？
        hiscore[2] = myscore //仮に最下位とする
        for (let i = 2; i > 0; i--) { //1位までについてくり返す
            if (hiscore[i - 1] < hiscore[i]) { //逆順になっていたら
                let temp = hiscore[i - 1]
                hiscore[i - 1] = hiscore[i] //交換する
                hiscore[i] = temp
            } else { //でなければ
                break //更新完了
            }
        }
    }
}

//ハイスコアを表示
function drawhiscore() {
    ctx.font = '24pt Arial' //文字サイズを指定
    ctx.fillStyle = 'Black' //文字を黒色に
    ctx.fillText("HI-SCORE", 174, 302) //左下に「HI-SCORE」を表示
    ctx.fillStyle = 'Orange' //文字をオレンジ色に
    ctx.fillText("HI-SCORE", 176, 304) //左下に「HI-SCORE」を表示
    for (let i = 0; i < 3; i++) { //3位までについてくり返す
        ctx.fillStyle = 'Black' //文字を黒色に
        ctx.fillText((i + 1) + ": " + ("000000" + hiscore[i]).slice(-6), 342, 302 + 34 * i) //中央下にハイスコアを6桁で表示
        ctx.fillStyle = 'Orange' //文字をオレンジ色に
        ctx.fillText((i + 1) + ": " + ("000000" + hiscore[i]).slice(-6), 344, 304 + 34 * i) //中央下にハイスコアを6桁で表示
    }
}

//残りドローンを表示
function drawdronenum(num) {
    for (let i = 0; i < num - 1; i++) { //残りドローン数-1までについてくり返す
        ctx.drawImage(drone, 5 + i * 24, 5, 22, 22) //ドローン画像を表示
    }
}
