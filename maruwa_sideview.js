new function() {

	var use_offscreen = 1;

	var canvas;// = document.getElementById('maincanvas');
	var offscreen;// = document.createElement('canvas');
	var ctx_c;//  = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
	var ctx_o;// = (offscreen && offscreen.getContext) ? offscreen.getContext('2d') : null;
	var contents;// = document.getElementById('contents');
	var canvas_w;// = window.innerWidth;
	var canvas_h;// = window.innerHeight;
	var chrs = {};
	var imgs = {};

	(
		function() {
			Math.clamp = function(a,b,c) {
				return Math.max(b,Math.min(c,a));
			}
		}
	)();

	(
		function() {
			timeStampedFile = function(a) {
				return a + "?" + new Date().getTime();
			}
		}
	)();

	/*Charactor Class*/
	class Sprite {
		constructor( name, img ) {
			this._name = name;

			if (Array.isArray(img))
			{
				this._imgs = img;
			}
			else
			{
				this._imgs = new Array(1);
				this._imgs[0] = img;
			}
			this._animFrame = 0;
			this._animSpeed = 3;
			this._animWait = 0;

			this._pos = {};
			this._pos.x = 0;
			this._pos.y = 0;

			this._alpha = 1;

			this._scale = 1;

			this._rot = 0;
			this._rad = 0;

			this._start = function(a) {}
			this._update = function(a) {}
		}

		setPos(x,y) {
			this._pos.x = x;
			this._pos.y = y;
		}

		get pos() {
			return this._pos;
		}

		set alpha(a) {
			this._alpha = a;
		}

		get alpha() {
			return this._alpha;
		}

		draw( ctx )
		{
			var img = this.image;
			var scale = this._scale;
			var angle = this._rot;
			var hw = img.width / 2 * scale;
			var hh = img.height / 2 * scale;
			ctx.save();
			ctx.translate(
					this._pos.x,
					this._pos.y,
				);
			ctx.rotate(angle/180*Math.PI);
			ctx.translate(
					- hw,
					- hh,
				);
			ctx.scale( scale, scale );
			ctx.globalAlpha = this._alpha;
			ctx.drawImage( img, 0,0 );
			ctx.restore();
		}

		set rotate(deg) {
			this._rot = deg;
			while (this._rot < 0) { this._rot += 360; }
			this._rot %= 360;
			this._rad = this._rot / 180 * Math.PI;
		}
		get rotate() {
			return this._rot;
		}

		set scale(s) {
			this._scale = s;
		}

		get scale() {
			return this._scale;
		}

		get animeCount() {
			return this._imgs.length;
		}

		set animeFrame( i ) {
			this._animFrame = Math.clamp( i, 0, this._imgs.length - 1);
		}
		get animeFrame() {
			return this._animFrame;
		}
		set animeSpeed( speed ) {
			this._animSpeed = speed;
			this._animWait = 0;
		}
		get animeSpeed() {
			return this._animSpeed;
		}

		update_anime(c) {
			if (++this._animWait >= this._animSpeed)
			{
				this._animWait = 0;
				if (++this._animFrame >= this._imgs.length)
				{
					this._animFrame = 0;
				}
			}
		}

		start() {
			this._start(this);
		}

		update() {
			this._update(this);
			this.update_anime(this);
		}


		get image() {
			return this._imgs[parseInt(this._animFrame)];
		}
		get name() {
			return this._name;
		}
	}

	/*画像ロード*/
	//imgs.bg = new Image();
	//imgs.bg.src = timeStampedFile("img/METALGEAR2-199010-with-maruwa.jpg");

	imgs.sero = new Image();
	imgs.sero.src = timeStampedFile("img/ぎょうちゅうセロファン.png");

	imgs.maruwa = new Array(7);
	for (var i = 0; i < imgs.maruwa.length; ++i)
	{
		imgs.maruwa[i] = new Image();
		imgs.maruwa[i].src = timeStampedFile("img/丸和太郎2-" + (1 + i) + ".png");
	}


	imgs.maruwa2 = new Array(7);
	for (var i = 0; i < imgs.maruwa2.length; ++i)
	{
		imgs.maruwa2[i] = new Image();
		imgs.maruwa2[i].src = timeStampedFile("img/丸和太郎3-" + (1 + i) + ".png");
	}

	/*Charaクラスに登録*/
	chrs.list = new Array();

	chrs.maruwa2 = new Array( 10 );
	for (var i = 0; i < chrs.maruwa2.length; ++i)
	{
		chrs.maruwa2[i] = new Sprite( "maruwa2-" + i, imgs.maruwa2 );
		chrs.maruwa2[i]._start = start_maruwa;
		chrs.maruwa2[i]._update = update_maruwa;
		chrs.maruwa2[i].alpha = 0.5;//0.1 + Math.random() * 0.3;
		chrs.list.push( chrs.maruwa2[i] );
	}

	chrs.maruwa = new Array( 84 );
	for (var i = 0; i < chrs.maruwa.length; ++i)
	{
		chrs.maruwa[i] = new Sprite( "maruwa-" + i, imgs.maruwa );
		chrs.maruwa[i]._start = start_maruwa;
		chrs.maruwa[i]._update = update_maruwa;
		chrs.maruwa[i].alpha = 0.5;//0.1 + Math.random() * 0.3;
		chrs.list.push( chrs.maruwa[i] );
	}

	chrs.sero = new Array( 6 );
	for (var i = 0; i < chrs.sero.length; ++i)
	{
		chrs.sero[i] = new Sprite( "sero-" + i, imgs.sero);
		chrs.sero[i]._start = start_maruwa;//start_zoomobj;
		chrs.sero[i]._update = update_maruwa;//update_zoomobj;
		chrs.sero[i].alpha = 0.5;//0.1 + Math.random() * 0.3;
		chrs.list.push( chrs.sero[i] );
	}

	/*丸和開始処理*/
	function start_maruwa(c) {
		var scale = 0.1 + Math.random() * 0.7;
		c.scale = scale;
		var w = c.image.width;
		var h = c.image.height;
		var cx = canvas_w;
		var cy = canvas_h;
		c._pos.x = Math.random() * (cx + w) - w * 0.5;
		c._pos.y = Math.random() * (cy + h * 0.5) - h * 0.25;
		c.animeFrame = parseInt( Math.random() * c.animeCount );
		c.rotate = Math.random() * 360;
		c.rot_speed = Math.random() * -1 - 0.04;//* 2 - 1;
		c.animeSpeed = 4;//Math.random() * 2 + 2;
	//	c.alpha = c.alpha * (1 - c.scale * 0.5);
		c.a_cnt = Math.random() * 0.5;
		c.a_spd = (1 + Math.random() * 2) * 0.25;
	}
	/*丸和毎フレーム処理*/
	function update_maruwa(c) {
		var maruwa_w_half = c.image.width / 2;
		c.pos.x -= c.scale * 10;
		if (1) // test
		{
			if (mouseData.btn.l || keyData.matrix[32])
			{
				c.pos.x -= c.scale * 20;
			}
		}
		if (c.pos.x < -maruwa_w_half)
		{
			c.pos.x = canvas_w + maruwa_w_half;
		}
		c.rotate = c.rotate + c.rot_speed;
		c.a_cnt += c.a_spd * 0.01;
		if (c.a_cnt > 4) c.a_cnt = 0;
		c.alpha = c.a_cnt > 2 ? 0 : (c.a_cnt > 1 ? (2 - c.a_cnt) : c.a_cnt) * 0.8;
	}
	/*中心ズームタイプ開始時処理*/
	function start_zoomobj(c) {
		c.z_fact = 0;
		c.alpha = 0.6;
		c.z_spd = 0.003;
		update_sero(c);
	}
	/*中心ズームタイプ毎フレーム処理*/
	function update_zoomobj(c) {
		var cx = canvas_w / 2;
		var cy = canvas_h / 2;
		var sero_x = Math.random() * 10 - 5;
		var sero_y = Math.random() * 10 - 5;

		const max_z = 5;
		const c_zoom = 0.5;
		const d_zoom = 0.125;

		c.z_fact += c.z_spd;
		if (c.z_fact > max_z * 2 ) c.z_fact = 0;
		if (c.z_fact >= max_z)
		{
			c.scale = c_zoom / (d_zoom + c.z_fact - max_z);
		}
		else
		{
			c.scale = c_zoom / (d_zoom + max_z - c.z_fact);
		}

		c.setPos( cx + sero_x * c.scale, cy + sero_y * c.scale );
	}

	/*================================*/

	var use_inner_timer = 0;
	const fps = 60;
	const frame_ms = 1000/fps;
	var pre_time = 0;
	var ms_delta = 0;
	var frame = 0;
	var first_frame = 0;

	/* イベント：読み込み終了＝全体のスタート */
	onload = function() {

		canvas = document.getElementById('maincanvas');
		offscreen = document.createElement('canvas');
		ctx_c = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
		ctx_o = (offscreen && offscreen.getContext) ? offscreen.getContext('2d') : null;
		contents = document.getElementById('contents');

		canvas_resize();
		InitUpdate();
		Draw();

		pre_time = performance.now();
		requestAnimationFrame(update);

		document.onkeypress   = onKeyPress;
		document.onkeydown    = onKeyDown;
		document.onkeyup      = onKeyUp;
		document.onmousemove  = onMouseMove;
		document.onmousedown  = onMouseDown;
		document.onmouseup    = onMouseUp;
		document.ontouchmove  = onTouchMove;
		document.ontouchstart = onTouchStart;
		document.ontouchend   = onTouchEnd;
	}

	/*イベント：キー・マウス*/
	var keyData = {}; // matrix,vx,vy
	keyData.matrix = new Array(256);
	keyData.matrix.forEach( function(e){ e = 0;});
	keyData.x = 0;
	keyData.y = 0;

	var mouseData = {}; // x,y,btn(.l,.r,.c)
	mouseData.x = 0;
	mouseData.y = 0;
	mouseData.btn = {};
	mouseData.btn.l = 0;
	mouseData.btn.r = 0;
	mouseData.btn.c = 0;

	function onKeyPress(e) {
	}
	function onKeyDown(e) {
		if (0 <= e.keyCode && e.keyCode < keyData.matrix.length)
		{
			keyData.matrix[e.keyCode] = 1;
		}
	}
	function onKeyUp(e) {
		if (0 <= e.keyCode && e.keyCode < keyData.matrix.length)
		{
			keyData.matrix[e.keyCode] = 0;
		}
	}
	function onUpdateKeys()
	{
		keyData.vx = keyData.matrix[37] ? -1 : keyData.matrix[39] ? 1 : 0;
		keyData.vy = keyData.matrix[38] ? -1 : keyData.matrix[40] ? 1 : 0;
	}
	function onMouseMove(e) {
		mouseData.x = (e.clientX + canvas.offsetLeft + document.body.scrollLeft);
		mouseData.y = (e.clientY + canvas.offsetTop + document.body.scrolTop);
		e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
	}
	function onMouseDown(e) {
		if (e.button == 0) mouseData.btn.l = 1;
		if (e.button == 1) mouseData.btn.c = 1;
		if (e.button == 2) mouseData.btn.r = 1;
		e.preventDefault(); //ダブルクリック回避
	}
	function onMouseUp(e) {
		if (e.button == 0) mouseData.btn.l = 0;
		if (e.button == 1) mouseData.btn.c = 0;
		if (e.button == 2) mouseData.btn.r = 0;
		e.preventDefault(); //ダブルクリック回避
	}
	/*タッチはワンボタンマウス扱いにしておく*/
	function onTouchMove(e) {
		var cnt = event.touches.length;
		mouseData.x = (e.touches[0].pageX + canvas.offsetLeft + document.body.scrollLeft);
		mouseData.y = (e.touches[0].pageY + canvas.offsetTop + document.body.scrolTop);
		e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
	}
	function onTouchStart(e) {
		mouseData.btn.l = 1;
		e.preventDefault(); //ダブルクリック回避
	}
	function onTouchEnd(e) {
		mouseData.btn.l = 0;
		e.preventDefault(); //ダブルクリック回避
	}


	/*イベント：Update処理*/
	function update()
	{
		requestAnimationFrame(update);

		var cur_time = performance.now();

		if (use_inner_timer)
		{
			ms_delta += cur_time - pre_time;
			while (ms_delta >= frame_ms || first_frame)
			{
				first_frame = 0;

				ms_delta -= frame_ms;
				frame++;

				fix_update();
				Draw();
			}
		}
		else
		{
			fix_update();
			Draw();
		}

		pre_time = cur_time;
		onDraw();
	}

	/* イベント：リサイズされた*/
	onresize = function() {
		canvas_resize();
		InitUpdate();
		Draw();
		onDraw();
	}


	/*＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/

	/*初期化*/
	function InitUpdate() {
		/*キャラ全部初期化*/
		chrs.list.forEach( function(i) {
			i.start();
		});
	}

	/*フレーム内部処理*/
	function fix_update() {

		/*キャラ全部更新*/
		chrs.list.forEach( function(i) {
			i.update();
		});
	}

	/*リサイズ時処理*/
	function canvas_resize() {
	//	return;
		canvas_w = window.innerWidth;
		canvas_h = window.innerHeight;
		//if (canvas_w > 960 || canvas_h > 960)
		//{
		//	canvas_w *= 0.5;
		//	canvas_h *= 0.5;
		//	use_offscreen = 0;
		//}
		//else
		//{
		//	use_offscreen = 1;
		//}
		canvas.width = canvas_w;
		canvas.height = canvas_h;

		if (offscreen && use_offscreen)
		{
			offscreen.width = canvas.width;
			offscreen.height = canvas.height;
		}
	}

	/*描画*/
	var b_i = 0;
	var graysccale = new Array();
	{
		for (var i = 0; i < 256; ++i)
		{
			graysccale.push("rgb(" + i +"," + i + "," + i);
		}
	}
	function Draw() {
		var ctx = ctx_c;
		var scr = canvas;

		if (offscreen && use_offscreen)
		{
			ctx = ctx_o;
			scr = offscreen;
		}


		//const fillColor = "rgba(0, 0, 0, 0.05)";
		//const fillColor = "rgba(256, 256, 256, 0.05";
		b_i += 0.2;
		if (b_i > 511 ) b_i = 0;
		b = parseInt(b_i > 255 ? 511 - b_i : b_i);
		const fillColor = graysccale[b];

		ctx.save();

		/*画面クリア*/
		if (0) {
			ctx.clearRect(0, 0, scr.width, scr.height);
		} else {
			ctx.save();
			ctx.fillStyle = fillColor;
			ctx.globalAlpha = 0.1;
		//	ctx.globalAlpha = 0.05;
			ctx.fillRect(0, 0, scr.width, scr.height);
			ctx.restore();
		}

		use_effect = !(mouseData.btn.l || keyData.matrix[32]);
		if (use_effect) // 太陽風エフェクトtest
		{
			const bl_mode = 2;
			const spd = -20;
			if (bl_mode)
			{
				ctx.save();
				ctx.globalAlpha = 0.25;
				ctx.drawImage( scr, spd,0 );
				ctx.restore();
			}
		}

		/*キャラ全部描画*/
		ctx.save();
	//	ctx.drawImage(imgs.bg, 0, 0 );
		chrs.list.forEach( function(i) {
			i.draw( ctx );
		});
		ctx.restore();


		ctx.restore();

	}
	var text_color = 0;
	function onDraw() {

		if (offscreen && use_offscreen)
		{
			ctx_c.drawImage(offscreen, 0, 0);
		}

		if (0)
		{
			ctx_c.save();
			const message = "タロディウスⅡ ～コーモンの野望～";
			const fontSize = 20;

			const text_colors = ["#ff6060","#ffb040","#ffff50","white", "#80ff80","#40a0ff","#e050e0","black" ];
			text_color = (text_color + 0.25) % text_colors.length;

		//	ctx_c.font = "bold " + fontSize + "px sans-serif";
			ctx_c.font = "bold " + fontSize + "px monospace";
			ctx_c.textBaseline = "top";

			var metrix = ctx_c.measureText( message );
			const x = (canvas_w - metrix.width) / 2;
			const y = (canvas_h - fontSize) / 2;

			ctx_c.save();
			ctx_c.fillStyle = "rgba(0, 0, 0, 0.4)";
			ctx_c.fillRect( x - 40, y - 2, metrix.width + 80, fontSize + 4);
			ctx_c.restore();

			ctx_c.fillStyle = text_colors[parseInt(text_color + 3) % text_colors.length];
			ctx_c.fillText( message, x, y );
		//	ctx_c.strokeStyle = "rgba(0, 0, 0, 0.5)";
		//	ctx_c.strokeText( message, x, y );
			ctx_c.restore();
		}
	}

	function putImgc(ctx, img, x, y)
	{
		ctx.drawImage( img, x - img.width/2, y - img.height/2);
	}
}