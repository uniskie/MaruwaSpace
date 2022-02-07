( function ( w, r )
{
	w[ 'r' + r ] = w[ 'r' + r ] || w[ 'webkitR' + r ] || w[ 'mozR' + r ] || w[ 'msR' + r ] || w[ 'oR' + r ] || function ( c ) { w.setTimeout( c, 1000 / 60 ); };
} )( window, 'equestAnimationFrame' );

( function ()
{
	Math.clamp = function ( a, b, c )
	{
		return Math.max( b, Math.min( c, a ) );
	}
}
)();

( function ()
{
	timeStampedFile = function ( a )
	{
		return a + "?" + new Date().getTime();
	}
}
)();

( function ()
{
	/*ファイル名を取り出す*/
	getFilename = function ( path )
	{
		return /[^\/]+$/.exec( path )[ 0 ].replace( /\.[^.]+$/, '' );
	}
}
)();

( function ()
{
	nop = function () { }
} )();

const default_camera_config = {
	def_sx: 800,		// デフォルト解像度
	def_sy: 600,		// デフォルト解像度
	eyelen: 200,		// Z=0の視点からのオフセット
	fov: 90,		// FOV 90度	（自然）（Z=0でeyelen）
	near: 50,		// ニアクリップ
	far: 4000,		// ファークリップ
};

class Pokeel
{

	constructor()
	{
		this.use_offscreen = 1;

		this.use_inner_timer = 1;

		this._fps = 60;
		this.frame_ms = 1000 / this._fps;
		this.update_mask = 0;

		this.fps = this._fps;
		this.ms_delta = 0;
		this.cur_time = 0;
		this.pre_time = 0;

		this.canvas;// = document.getElementById('maincanvas');
		this.offscreen;// = document.createElement('canvas');
		this.ctx_c;//  = (canvas && canvas.getContext) ? canvas.getContext('2d') : null;
		this.ctx_o;// = (offscreen && offscreen.getContext) ? offscreen.getContext('2d') : null;
		this.contents;// = document.getElementById('contents');

		this.canvas_w = 800;// = window.innerWidth;
		this.canvas_h = 600;// = window.innerHeight;

		this.frameCount = 0;
		this.updateCallCount = 0;
		this.validate = 0;

		this.running = false;
		this._paused = false;

		this.scene = -1;
		this.next_scene = 0;

		this.resource = null;
		this.images = null;
		this.audios = null;

		this.chrs = { list: null };

		this.camera = this.createCamera( default_camera_config );
		this.input = new InputManager();

		this.onloadprogress = null; //(ratio, ctx)
		this.onwindowresize = null;	//(pokeel, w, h)
		this.onvisibilitychange = null; //(pokeel)
		this.onloadcomplete = null;	//(pokeel)
		this.oninitupdate = null;	//(pokeel)
		this.onupdate = null;		//(pokeel)
		this.onendupdate = null;	//(pokeel)
		this.onfixupdate = null;	//(pokeel)
		this.onendfixupdate = null;	//(pokeel)
		this.onscenechange = null; 	//(pokeel, scene);
		this.onendupdate = null;	//(pokeel)
		this.onprerender = null;	//(pokeel, ctx) キャラ描画前
		this.custombgclear = null;	//(pokeel, ctx) 置き換え
		this.onendrender = null;	//(pokeel, ctx) キャラ描画後
	}
	set fps( v )
	{
		this._fps = v;
		this.frame_ms = 1000 / v;
		this.update_mask = 0;
		if ( 30 <= v && v < 60 ) { this.update_mask = 1; }
		else
			if ( 15 <= v && v < 30 ) { this.update_mask = 2; }
			else
				if ( v < 15 ) { this.update_mask = 4; }
	}
	get fps() { return this._fps; }
	set paused( f )
	{
		if ( this.audios )
		{
			if ( f )
			{
				this.audios.pauseBgm();
			} else
			{
				this.audios.unpauseBgm();
			}
		}
		this._paused = f;
	}
	get paused() { return this._paused; }

	createCamera( camera_config )
	{
		return this.camera = new Camera(
			camera_config.def_sx,	// スクリーンサイズは後で修正
			camera_config.def_sy,	// スクリーンサイズは後で修正
			camera_config.eyelen,	// Z=0の視点からのオフセット
			camera_config.fov, 		// FOV 90度
			camera_config.near, 	// ニアクリップ
			camera_config.far	 	// ファークリップ
		);
	}
	setScreenSize( w, h )
	{
		this.canvas_w = w;
		this.canvas_h = h;
		if ( this.canvas )
		{
			this.canvas.width = this.canvas_w;
			this.canvas.height = this.canvas_h;
		}
		if ( this.camera )
		{
			this.camera.setScreen( this.canvas_w, this.canvas_h );
		}
		if ( this.offscreen && this.use_offscreen )
		{
			this.offscreen.width = this.canvas.width;
			this.offscreen.height = this.canvas.height;
		}
	}
	attatchScreen( container )
	{
		this.contents = container.getElementById( 'contents' );
		this.canvas = container.getElementById( 'maincanvas' );
		this.offscreen = container.createElement( 'canvas' );

		this.input.canvas = this.canvas;

		this.ctx_c = ( this.canvas && this.canvas.getContext ) ? this.canvas.getContext( '2d' ) : null;
		this.ctx_o = ( this.offscreen && this.offscreen.getContext ) ? this.offscreen.getContext( '2d' ) : null;
		this.setScreenSize( this.canvas_w, this.canvas_h );
	}
	/*リサイズ時処理*/
	onWindowResize()
	{
		if ( this.onwindowresize )
		{
			this.onwindowresize( this, window.innerWidth, window.innerHeight );
		}
	}
	/*ウィンドウ表示/非表示*/
	onVisibilityChange()
	{
		if ( this.onvisibilitychange )
		{
			this.onvisibilitychange( this );
		}
	}
	setResource( res )
	{
		this.resource = new ResourceManager();
		this.resource.assign( res );
	}
	run()
	{
		if ( this.resource )
		{
			this.resource.onprogress = this.handleResourceProgress.bind( this );
			this.resource.oncomplete = this.handleResourceLoaded.bind( this );
			this.resource.loadAsync();
		} else
		{
			this.handleResourceLoaded();
		}
	}
	handleResourceProgress( ratio )
	{
		if ( this.onloadprogress )
		{
			this.onloadprogress( ratio, this.ctx_c );
		}
	}
	handleResourceLoaded()
	{
		this.running = true;
		window.onresize = this.onWindowResize.bind( this );
		document.addEventListener( "visibilitychange", this.onVisibilityChange.bind( this ) );
		this.audios = new AudioManager( this, this.resource );
		this.input.initInput();

		if ( this.onloadcomplete )
		{
			this.onloadcomplete( this );
		}

		this.init_update();

		this.pre_time = performance.now();
		this.ms_delta = this.frame_ms;
		this.update();
	}
	/*初期化*/
	init_update()
	{
		if ( this.oninitupdate )
		{
			this.oninitupdate( this );
		}
		/*キャラ全部初期化*/
		for ( let i = 0; i < this.chrs.list.length; ++i )
		{
			if ( this.chrs.list[ i ] ) this.chrs.list[ i ].start();
		}
	}
	/*イベント：Update処理*/
	update()
	{
		this.cur_time = performance.now();
		window.requestAnimationFrame( this.update.bind( this ) );

		++this.updateCallCount;
		if ( this.updateCallCount >= 0x7fffffffffffffff )
		{
			this.updateCallCount = 0;
		}

		if ( this.onupdate )
		{
			this.onupdate( this );
		}
		if ( this.use_inner_timer )
		{
			let count = 0;
			const limit = 10;
			this.ms_delta += this.cur_time - this.pre_time;
			while ( this.ms_delta >= this.frame_ms )
			{
				this.ms_delta -= this.frame_ms;
				this.frame++;

				this.fix_update();
				this.render();

				if ( ++count > limit )
				{
					this.ms_delta = 0;
					break;
				}
			}
		} else
		{
			if ( this.update_mask == 0 || ( this.updateCallCount & this.update_mask ) )
			{
				this.fix_update();
				this.render();
			}
		}

		this.pre_time = this.cur_time;
		this.redraw();

		if ( this.onendupdate )
		{
			this.onendupdate( this );
		}
	}
	/*フレーム内部処理*/
	fix_update()
	{
		++this.frameCount;
		if ( this.frameCount >= 0x7fffffffffffffff )
		{
			this.frameCount = 0;
		}

		this.input.update_input();	// キートリガなどの判定

		if ( !this.running || this._paused ) return;

		if ( this.onfixupdate )
		{
			this.onfixupdate( this );
		}
		/*キャラ全部更新*/
		for ( let i = 0; i < this.chrs.list.length; ++i )
		{
			if ( this.chrs.list[ i ] ) this.chrs.list[ i ].update();
		}

		if ( this.onendfixupdate )
		{
			this.onendfixupdate( this );
		}

		if ( this.next_scene != null )
		{
			this.scene = this.next_scene;
			if ( this.onscenechange )
			{
				this.onscenechange( this, this.scene );
			}
		}
	}
	/*描画*/
	render()
	{
		if ( !this.running || this._paused ) return;

		let ctx = ( this.offscreen && this.use_offscreen ) ? this.ctx_o : this.ctx_c;
		let chrs = this.chrs;

		ctx.save();

		if ( this.custombgclear )
		{
			this.custombgclear( this, ctx );
		}
		else
		{
			/*画面クリア*/
			ctx.save();
			ctx.fillStyle = fillColor;
			ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );
			ctx.restore();
		}

		if ( this.onprerender )
		{
			this.onprerender( this, ctx );
		}

		/*キャラ全部描画*/
		ctx.save();
		if ( 1 )
		{
			// 描画順ソート
			chrs.draw_list.sort( function ( a, b )
			{
				// LayerIDが大きい順（先に書く＝奥）
				if ( a._pos.layer_id < b._pos.layer_id ) return 1;
				if ( a._pos.layer_id > b._pos.layer_id ) return -1;
				// Zが大きい順（先に書く＝奥）
				if ( a._pos.z < b._pos.z ) return 1;
				if ( a._pos.z > b._pos.z ) return -1;
				// Orderが大きい順（先に書く＝奥）
				if ( a._pos.order < b._pos.order ) return 1;
				if ( a._pos.order > b._pos.order ) return -1;
				// Yが小さい順（先に書く＝奥）
				if ( a._pos.y < b._pos.y ) return -1;
				if ( a._pos.y > b._pos.y ) return 1;
				return 0;
			} );
		}
		for ( let i = 0; i < chrs.draw_list.length; ++i )
		{
			if ( chrs.draw_list[ i ] ) chrs.draw_list[ i ].render( ctx );
		}
		ctx.restore();

		if ( this.onendrender )
		{
			this.onendrender( this, ctx );
		}

		ctx.restore();

	}
	redraw()
	{
		if ( this.offscreen && this.use_offscreen )
		{
			this.ctx_c.drawImage( this.offscreen, 0, 0 );
		}

		if ( this.onredraw )
		{
			this.onredraw( this, this.ctx_c );
		}
	}


};

/*キャラクタークラス*/
class Sprite
{
	constructor( name, img )
	{
		this._name = name;

		if ( Array.isArray( img ) )
		{
			this._imgs = img;
		}
		else
		{
			this._imgs = new Array( 1 );
			this._imgs[ 0 ] = img;
		}
		this._animFrame = 0;
		this._animSpeed = 3;
		this._animWait = 0;

		this._pos = {};
		this._pos.x = 0;
		this._pos.y = 0;
		this._pos.z = 0;

		this._pos.layer_id = 16;
		this._pos.order = 0;

		this._translated_pos = {};
		this._translated_pos.inited = false;
		this._translated_pos.x = 0;
		this._translated_pos.y = 0;
		this._translated_pos.z = 0;
		this._translated_pos.scale = 1;

		this._alpha = 1;

		this._scale = 1;

		this._rot = 0;
		this._rad = 0;

		this._start = nop;
		this._update = nop;
		//this._render = nop;
		this._render = this.default_render;
	}

	get name() { return this._name; }

	setPos( x, y, z )
	{
		this._pos.x = x;
		this._pos.y = y;
		this._pos.z = z;
	}

	get pos()
	{
		return { x: this._pos.x, y: this._pos.y, z: this._pos.z };
	}
	set pos( p )
	{
		this._pos.x = p.x;
		this._pos.y = p.y;
		this._pos.z = p.z;
	}

	set alpha( a )
	{
		this._alpha = a;
	}

	get alpha()
	{
		return this._alpha;
	}

	default_render( obj, ctx )
	{
		if ( !this._translated_pos.inited )
		{
			return;	// not updated
		}

		let img = this.image;
		let pos = this.translated_pos;
		if ( pos.z < 0 || 1 < pos.z ) return;	// 範囲外
		let scale = this._scale * pos.scale;
		let angle = this._rot;
		let hw = img.width / 2 * scale;
		let hh = img.height / 2 * scale;

		ctx.save();
		ctx.translate(
			pos.x,
			pos.y,
		);
		ctx.rotate( angle / 180 * Math.PI );
		ctx.translate(
			- hw,
			- hh,
		);
		ctx.scale( scale, scale );
		ctx.globalAlpha = this._alpha;
		ctx.drawImage( img, 0, 0 );
		ctx.restore();
	}

	set rotate( deg )
	{
		this._rot = deg;
		while ( this._rot < 0 ) { this._rot += 360; }
		this._rot %= 360;
		this._rad = this._rot / 180 * Math.PI;
	}
	get rotate() { return this._rot; }
	set scale( s ) { this._scale = s; }
	get scale() { return this._scale; }
	get animeCount()
	{
		return ( this._imgs.anim_list ) ? this._imgs.anim_list.length : this._imgs.length;
	}
	set animeFrame( i )
	{
		this._animFrame = Math.clamp( i, 0, this.animeCount - 1 );
	}
	get animeFrame() { return this._animFrame; }
	set animeSpeed( speed )
	{
		this._animSpeed = speed;
		this._animWait = 0;
	}
	get animeSpeed() { return this._animSpeed; }

	update_anime( c )
	{
		if ( ++this._animWait >= this._animSpeed )
		{
			this._animWait = 0;
			if ( ++this._animFrame >= this.animeCount )
			{
				this._animFrame = 0;
			}
		}
	}

	start()
	{
		this._start( this );
	}

	update()
	{
		this._update( this );
		this.update_anime( this );
		this.translate();
	}

	render( ctx )
	{
		this._render( this, ctx );
	}

	translate()
	{
		let pos = this.pos;
		pos.scale = 1;
		if ( this._translator )
		{
			pos = this._translator.translate( this.pos );
		}
		this._translated_pos = pos; // 描画時の位置を保存
		this._translated_pos.inited = true;
	}

	get translated_pos()
	{
		return {
			x: this._translated_pos.x,
			y: this._translated_pos.y,
			z: this._translated_pos.z,
			scale: this._translated_pos.scale
		};
	}

	get image()
	{
		let i = parseInt( this._animFrame );
		if ( this._imgs.anim_list )
		{
			i = Math.min( i, this._imgs.anim_list.length );
			i = this._imgs.anim_list[ i ];
			i = Math.min( i, this._imgs.length );
			return this._imgs[ i ];
		}
		return this._imgs[ parseInt( this._animFrame ) ];
	}
}

/*一点透視カメラクラス*/
class Camera
{

	constructor( _w, _h, _eyelen, _fov_deg, _near, _far )
	{
		this._screen = { w: _w, h: _h };
		this._center = { x: _w * 0.5, y: _h * 0.5 };
		this._fov = _fov_deg;
		this._eyelen = _eyelen;//_w * 0.5; // FOV=45の時にZ=0で等倍になるようにカメラ位置自動調整
		this._near = _near;
		this._far = _far;
		this._zoom = 1;
		this._zoom_rev = 1 / this._zoom;
		this._scale = 1;
		this._scale_rev = 1 / this._scale;
		this.fovUpdated();
	}
	fovUpdated()
	{
		this._scale = this._eyelen * Math.tan( this._fov * 0.5 * Math.PI / 180 );
		this._scale *= this._zoom;
		this._scale_rev = 1 / this._scale;
	}
	get zoom() { return this._zoom; }
	get zoom_rev() { return this._zoom_rev; }
	set zoom( z ) { this._zoom = z; this._zoom_rev = 1 / this._zoom; this.fovUpdated(); }
	get scale() { return this._scale; }
	get scale_rev() { return this._scale_rev; }
	set fov( d ) { this._fov = d; this.fovUpdated(); }
	get fov() { return this._fov; }
	set eyelen( e ) { this._eyelen = e; this.fovUpdated(); }
	get eyelen() { return this._eyelen; }
	set near( e ) { this._near = e; }
	get near() { return this._near; }
	get nearPos() { return { x: 0, y: 0, z: ( this._near - this._eyelen ) }; }
	set far( e ) { this._far = e; }
	get far() { return this._far; }
	get farPos() { return { x: 0, y: 0, z: ( this._far - this._eyelen ) }; }
	set width( w ) { this._w = w; }
	get width() { return this._screen.w; }
	set height( h ) { this._screen.h = h; }
	get height() { return this._screen.h; }
	setScreen( w, h )
	{
		this._screen.w = w;
		this._screen.h = h;
		this._center.x = w * 0.5;
		this._center.y = h * 0.5;
	}
	get screenSize() { return { x: this._screen.w, y: this._screen.h } }
	get center() { return { x: this._center.x, y: this._center.y } }
	projection( pos )	// x,y,z -> x,y,z,scale
	{
		let scale = this._scale;
		let far = this._far;
		let near = this._near;
		let eye_z = -this._eyelen;
		let p = {
			x: pos.x - this._center.x,	// 画面中心からの距離
			y: pos.y - this._center.y,	// 画面中心からの距離
			z: pos.z - eye_z			// 視点からの距離
		};
		p.x *= scale;
		p.y *= scale; // 正規化はしてないのでアスペクト比は掛けなくても良い
		let range = far - near;
		let z = far * ( p.z - near ) / range; // ニアファークリップ検査
		// w（元のz）で除算済みのスケール変換が完了した座標を返す
		let d = {
			x: p.x / p.z,
			y: p.y / p.z,
			z: z / p.z,
			scale: scale / p.z
		}
		// {
		// 	let dr = {
		// 		x: d.x / (this.center.x * 3),
		// 		y: d.y / (this.center.y * 3)
		// 	}
		// 	const a1 = -0.3;
		// 	const a2 = -0.02;
		// 	let r2 = Math.min(1, dr.x * dr.x + dr.y * dr.y);
		// 	let rscale = 1 + a1 * r2 + a2 * r2 * r2;
		// 	d.x *= rscale;
		// 	d.y *= rscale;
		// //	d.scale *= rscale;
		// }
		return {
			x: d.x + this._center.x,
			y: d.y + this._center.y,
			z: d.z, 			// near far の範囲内なら0-1の範囲
			zdash: p.z,			// 除算に使用したz'
			scale: d.scale		// 拡大率
		};
	}
	calcScale( _z )
	{
		return this._scale / ( _z + this._eyelen ) * this._zoom;
	}
	// 共通インタフェース
	translate( pos )	// x,y,z -> x,y,z,scale
	{
		return this.projection( pos );
	}
};

class AudioManager
{
	constructor( pokeel, resource )
	{
		this._pokeel = pokeel;
		this._resources = resource;

		this._playQueue = {};
		this._masterVolume = 1;
		this._effectVolume = 1;
		this._bgmVolume = 1;
		this._currentBgm = '';

		this._bgmFadeoutTimer = null;
		this._bgmFadeoutFactor = null;
	}

	get masterVolume() { return this._masterVolume; }
	set masterVolume( v ) { this._masterVolume = v; }
	get effectVolume() { return this._effectVolume; }
	set effectVolume( v ) { this._effectVolume = v; }
	get bgmVolume() { return this._bgmVolume; }
	set bgmVolume( v ) { this._bgmVolume = v; }

	playQueue()
	{
		if ( !this._resources ) return;

		let now = +Date.now();
		let count = 0;
		for ( let key in this._playQueue )
		{
			count++;

			let a = this._resources.audios[ key ];
			if ( !a || now - a.getAttribute( 'start_from' ) < 100 ) { continue; }

			//if( a.ended ) a.pause();
			a.loop = this._playQueue[ key ][ 0 ];
			a.volume = this._playQueue[ key ][ 1 ];
			a.currentTime = 0;
			a.setAttribute( 'start_from', now );
			a.play();
		}
		if ( count )
		{
			this._playQueue = {};
		}
	}

	play( key, isBgm )
	{
		let a;
		if ( this._resources && ( a = this._resources.audios[ key ] ) )
		{
			let m = this._resources.metaData[ key ];
			let volume = this._masterVolume * ( isBgm ? this._bgmVolume : this._effectVolume );
			let loop = isBgm;
			if ( m )
			{
				if ( m.volume != undefined )
				{
					volume *= m.volume;
				}
			}
			if ( this._pokeel.isInFrame )
			{
				this._playQueue[ key ] = [ loop, Math.min( 1, volume ) ];
			}
			else
			{
				if ( !a.ended )
				{
					a.pause();
				}

				a.loop = loop;
				a.volume = Math.min( 1, volume );
				a.currentTime = 0;
				a.play();
			}
		}
	}

	playBgm( key, quick )
	{
		let a;
		if ( !this._resources ) return;

		if ( this._currentBgm && ( a = this._resources.audios[ this._currentBgm ] ) )
		{
			if ( a.ended || a.paused )
			{
				this.clearBgmFadeoutTimer( true );
				this.play( key, true );
				this._currentBgm = key;
			}
			else if ( quick )
			{
				this.clearBgmFadeoutTimer( true );
				a.pause();
				a.currentTime = 0;
				this.play( key, true );
				this._currentBgm = key;
			}
			else
			{
				this.clearBgmFadeoutTimer( true );
				let volume = a.volume;
				let factor = this._bgmFadeoutFactor <= 0 ? 1 : this._bgmFadeoutFactor;
				const playBgmNext = () =>
				{
					this._bgmFadeoutTimer = null;
					factor -= 0.1;
					if ( factor <= 0 )
					{
						a.pause();
						a.currentTime = 0;
						this.play( key, true );
						this._currentBgm = key;
					}
					else
					{
						a.volume = volume * factor;
						this._bgmFadeoutTimer =
							//setTimeout( arguments.callee, 200 );
							setTimeout( playBgmNext.bind( this ), 200 );
					}
					this._bgmFadeoutFactor = factor;
				}
				playBgmNext();
			}
		}
		else
		{
			this.play( key, true );
			this._currentBgm = key;
		}
	}

	pauseBgm()
	{
		let a;
		if ( this._currentBgm && this._resources && ( a = this._resources.audios[ this._currentBgm ] ) )
		{
			a.pause();
		}
	}

	unpauseBgm()
	{
		let a;
		if ( this._currentBgm && this._resources && ( a = this._resources.audios[ this._currentBgm ] ) )
		{
			a.play();
		}
	}

	stopBgm()
	{
		this.clearBgmFadeoutTimer();
		pauseBgm();
		this._currentBgm = '';
	}

	fadeOutBgm( time )
	{
		let a;
		this.clearBgmFadeoutTimer();
		if ( this._currentBgm && this._resources && ( a = this._resources.audios[ this._currentBgm ] ) )
		{
			let volume = a.volume;
			let factor = this._bgmFadeoutFactor <= 0 ? 1 : this._bgmFadeoutFactor;
			time = time || 2;
			const fadeOutBgmNext = () =>
			{
				this._bgmFadeoutTimer = null;
				factor -= 0.1;
				if ( factor <= 0 )
				{
					a.pause();
					a.currentTime = 0;
					this._currentBgm = '';
				}
				else
				{
					a.volume = volume * factor;
					this._bgmFadeoutTimer =
						//	setTimeout( arguments.callee, time * 100 );
						setTimeout( fadeOutBgmNext.bind( this ), time * 100 );
				}
				this._bgmFadeoutFactor = factor;
			}
			fadeOutBgmNext();
		}
	}

	clearBgmFadeoutTimer( stop )
	{
		if ( !this._bgmFadeoutTimer )
		{
			return;
		}
		clearTimeout( this._bgmFadeoutTimer );
		this._bgmFadeoutTimer = null;
		if ( stop === true )
		{
			this.stopBgm();
		}
	}
};

class ResourceManager
{

	constructor()
	{
		this.resources = null;
		this.images = {};
		this.audios = {};
		this.metaData = {};
		this.loadRest = 0;
		this.loadCount = 0;
		this.oncomplete = null;
		this.onprogress = null;
	}
	craateLoadEventHandler( obj, name, handler, is_error )
	{
		return function myLoadEventHandler()
		{
			if ( typeof handler == 'function' )
			{
				handler( is_error ? null : obj );
			}
			if ( obj instanceof HTMLImageElement )
			{
				if ( is_error ) { console.log( 'imege load failure. ' + obj.src.replace( /\.[^.]+$/, '' ) ); }
				obj.onload = obj.onerror = null;
				obj = null;
			}
			else if ( obj instanceof XMLHttpRequest )
			{
				if ( is_error ) { console.log( 'text load failure. ' + obj.src.replace( /\.[^.]+$/, '' ) ); }
				obj.onload = obj.onerror = null;
				obj = null;
			}
			else if ( obj instanceof HTMLAudioElement )
			{
				if ( is_error ) { console.log( 'audio load failure. ' + obj.src.replace( /\.[^.]+$/, '' ) ); }
				//obj.removeEventListener( 'loadeddata', arguments.callee, false );
				//obj.removeEventListener( 'error', arguments.callee, false );
				obj.removeEventListener( 'loadeddata', myLoadEventHandler, false );
				obj.removeEventListener( 'error', myLoadEventHandler, false );
				obj = null;
				if ( is_error ) delete this.audios[ name ];
			}
			if ( --this.loadRest <= 0 )
			{
				// 完了
				if ( this.oncomplete ) this.oncomplete();
			}
			else
			{
				// 継続中
				if ( this.onprogress )
				{
					this.onprogress( 1 - ( this.loadRest / this.loadCount ) );
				}
			}
		}.bind( this );
	}
	assign( rList )
	{
		this.resources = rList;
	}
	loadAsync()
	{
		for ( let l_step = 0; l_step < 2; ++l_step )
		{
			for ( let i in this.resources )
			{
				switch ( i )
				{
					case 'image':
						for ( let j in this.resources[ i ] )
						{
							let name = j;
							let data = this.resources[ i ][ j ];
							let list = data.file;
							let option = data.opt;
							switch ( l_step )
							{
								case 0:
									for ( let k in list )
									{//= 0; j < list.length; ++j) {
										++this.loadRest;
										++this.loadCount;
									}
									break;
								case 1:
									{
										let image = new Array( list.length );
										this.images[ name ] = image;
										// 追加データがあれば格納
										if ( option != null && typeof option == 'object' )
										{
											for ( let p in option )
											{
												image[ p ] = option[ p ];		// Imageオブジェクトに直接追加 （ちょっと危ない？）
											}
											//this.metadata[ name ]  = option;	// 連想配列に格納（安全）
										}
										// 読み込み
										for ( let k in list )
										{//= 0; j < list.length; ++j) {
											image[ k ] = new Image;
											this.images[ name ].push( image[ k ] );
											image[ k ].onload = this.craateLoadEventHandler( image[ k ], name, option );
											image[ k ].onerror = this.craateLoadEventHandler( image[ k ], name, option, true );
											image[ k ].src = timeStampedFile( list[ k ] );
										}
										break;
									}
							}
						}
						break;
					case 'text':
						for ( let j in this.resources[ i ] )
						{
							switch ( l_step )
							{
								case 0:
									++this.loadRest;
									++this.loadCount
									break;
								case 1:
									{
										let name = getFilename( j );
										let xhr = new XMLHttpRequest();
										xhr._src = j;
										xhr.onload = this.craateLoadEventHandler( xhr, name, this.resources[ i ][ j ] );
										xhr.onerror = this.craateLoadEventHandler( xhr, name, this.resources[ i ][ j ], true );
										xhr.open( 'GET', j, true );
										xhr.setRequestHeader( 'If-Modified-Since', 'Fri, 01 Jan 2010 00:00:00 GMT' );
										xhr.send( null );
										break;
									}
							}
						}
						break;
					case 'audio':
						if ( /[?&]noaudio/.test( location.search ) )
						{
							break;	// audio抑制
						}
						for ( let j in this.resources[ i ] )
						{
							switch ( l_step )
							{
								case 0:
									++this.loadRest;
									++this.loadCount
									break;
								case 1:
									{
										let ext = '';
										let name = getFilename( j );
										let a = new Audio();
										if ( a.canPlayType( 'audio/ogg' ) )
										{
											ext = '.ogg';
										}
										else if ( a.canPlayType( 'audio/mpeg' ) )
										{
											ext = '.mp3';
										}
										if ( this.resources[ i ][ j ] != null && typeof this.resources[ i ][ j ] == 'object' )
										{
											this.metaData[ name ] = this.resources[ i ][ j ];
										}
										this.audios[ name ] = a;
										a.addEventListener( 'loadeddata', this.craateLoadEventHandler( a, name, this.resources[ i ][ j ] ), false );
										a.addEventListener( 'error', this.craateLoadEventHandler( a, name, this.resources[ i ][ j ], true ), false );
										//a.onloadeddata = this.craateLoadEventHandler( a, name, this.resources[ i ][ j ] );
										//a.onerror = this.craateLoadEventHandler( a, name, this.resources[ i ][ j ], true );
										a.src = j.replace( /\.[^.\/]+$/, '' ) + ext;
										break;
									}
							}
						}
						break;
				}
			}
		}
		// 完了
		this.resources = null;
	}
};
/*======================================*/
/*イベント：キー・マウス*/
class InputManager
{
	// キースキャンコード定数
	get keyScanCode()
	{
		const _keyScanCode =
		{
			F1				:112,	// ファンクションキー
			F2				:113,	// ファンクションキー
			F3				:114,	// ファンクションキー
			F4				:115,	// ファンクションキー
			F5				:116,	// ファンクションキー
			F6				:117,	// ファンクションキー
			F7				:118,	// ファンクションキー
			F8				:119,	// ファンクションキー
			F9				:120,	// ファンクションキー
			F10				:121,	// ファンクションキー
			F11				:122,	// ファンクションキー
			F12				:123,	// ファンクションキー

			Insert			:45,	// Insert
			Delete			:46,	// Delete

			BackSpace		:8,		// BackSpace
			Tab				:9,		// Tab
			Enter			:13,	// Enter

			Shift			:16,	// Shift
			Ctrl			:17,	// Ctrl
			Alt				:18,	// Alt

			NumLock			:144,	// NumLock
			ScrollLock		:145,	// ScrollLock
			Pause			:19,	// Pause
			Space			:32,	// Space
			PageUp			:33,	// PageUp
			PageDown		:34,	// PageDown
			End				:35,	// End
			Home			:36,	// Home

			Left			:37,	// ←（左）
			Up				:38,	// ↑（上）
			Right			:39,	// →（右）
			Down			:40,	// ↓（下）

			Win				:91,	// Windowsキー
			Apps			:93,	// Menuキー

			Eisuu			:240,	// 英数/CapsLock
			Kana			:242, 	// カタカナ/ひらがな
			HankakuZenkaku	:244, 	// 半角/全角
			Henkan			:28, 	// 変換
			Muhenkan		:29,	// 無変換

			// Normal
			Alphabet		:65, 	// A-Z
			Numeric			:48,	// 0-9
			Colon			:186,	// :*
			SemiColon		:187,	// ;+
			comma			:188,	// ,<
			Minus			:189,	// -=
			Period			:190,	// .>
			Slash			:191,	// \?
			AtMark			:192,	// @`
			LBracket		:219,	// [{
			Yen				:220,	// \|
			RBracket		:221,	// ]}
			Caret			:222,	// ^~
			BackSlash		:226,	// \_

			// Ten-Key
			T_Numeric		:96,	// テンキーの 0-9
			T_Asterisk		:106,	// テンキーの *
			T_Plus			:107,	// テンキーの +
			T_Minus			:108,	// テンキーの -
			T_Period		:110,	// テンキーの .
			T_Slash			:111,	// テンキーの /

			maxCount		:256
		};
		return _keyScanCode;
	}
	get keyState()
	{
		const _keyState = {
			off		: 0,	// OFF
			on		: 1,	// OFF -> ON
			on2on	: 2,	// ON -> ON
			on2off	: 3,	// ON -> OFF
		};
		return _keyState;
	}
	get mouseBtn()
	{
		const _mouseBtn = {
			left	: 0,
			right	: 1,
			center	: 2,
			btn4	: 3,	// ※対応してない環境有り
			btn5	: 4,	// ※対応してない環境有り
		};
		return _mouseBtn;
	}

	constructor()
	{
		this.canvas = null;
		this.keyData = {
			vx: 0, vy: 0,
			press	: Array( this.keyScanCode.maxCount ),
			prev	: Array( this.keyScanCode.maxCount ),
			trigger	: Array( this.keyScanCode.maxCount ),
			release	: Array( this.keyScanCode.maxCount ),
		};
		// forEachではEmpty（undefined）要素を除外してしまうので初期化には向かない
		let dks = this.keyState.off;
		for ( let i = 0; i < this.keyData.press.length; ++i )
		{
			this.keyData.press	[ i ] = dks;
			this.keyData.prev	[ i ] = dks;
			this.keyData.trigger[ i ] = dks;
			this.keyData.release[ i ] = dks;
		}
		this.mouseData = {
			pos: {
				x		: 0,
				y		: 0,
				pre_x	: 0,	// 前回
				pre_y	: 0,
				dx		: 0,	// 前回との差分
				dy		: 0,
				drg_x	: [ 0, 0, 0, 0, 0 ],	// マウスダウン中の前回との差分
				drg_y	: [ 0, 0, 0, 0, 0 ],
			},
			wheel: {
				sx: 0, sy: 0, sz: 0,	// トータルスクロール量
				dx: 0, dy: 0, dz: 0,	// スクロール変化量（フレーム毎：フレームの最初でtx*からコピー）
				tdx: 0, tdy: 0, tdz: 0,	// スクロール変化量（フレーム毎の蓄積用：フレームの最初でクリア）
			},
			press	: [ dks, dks, dks, dks, dks ],
			prev	: [ dks, dks, dks, dks, dks ],
			trigger	: [ dks, dks, dks, dks, dks ],
			release	: [ dks, dks, dks, dks, dks ]
		};
	}

	initInput()
	{
		document.onkeypress 	= this.onKeyPress.bind(this);
		document.onkeydown 		= this.onKeyDown.bind(this);
		document.onkeyup 		= this.onKeyUp.bind(this);
		document.oncontextmenu 	= this.onContextMenu.bind(this);
		document.onwheel 		= this.onWheel.bind(this);
		document.onmousemove 	= this.onMouseMove.bind(this);
		document.onmousedown 	= this.onMouseDown.bind(this);
		document.onmouseup 		= this.onMouseUp.bind(this);
		document.ontouchmove 	= this.onTouchMove.bind(this);
		document.ontouchstart 	= this.onTouchStart.bind(this);
		document.ontouchend 	= this.onTouchEnd.bind(this);
	};
	/* key / mouse の入力エッジ検出 */
	update_input()
	{
		// キー入力
		// カーソルキー
		this.keyData.vx = this.keyData.press[ 37 ] ? -1 : this.keyData.press[ 39 ] ? 1 : 0;
		this.keyData.vy = this.keyData.press[ 38 ] ? -1 : this.keyData.press[ 40 ] ? 1 : 0;
		// キー入力エッジの検出
		for ( let i = 0; i < this.keyData.press.length; ++i )
		{
			this.keyData.trigger[ i ] = this.keyData.press[ i ] && !this.keyData.prev[ i ];
			this.keyData.release[ i ] = !this.keyData.press[ i ] && this.keyData.prev[ i ];
			this.keyData.prev[ i ] = this.keyData.press[ i ];
			if ( this.keyData.press[ i ] == this.keyState.on )
			{
				this.keyData.press[ i ] = this.keyState.on2on;	// 受理済み
			}
			if ( this.keyData.press[ i ] == this.keyState.on2off )
			{
				this.keyData.press[ i ] = this.keyState.off;	// 受理前のリリースを状態に反映
			}
		}
		// マウス
		// 前フレームからの移動量
		this.mouseData.pos.dx = this.mouseData.pos.x - this.mouseData.pos.pre_x;
		this.mouseData.pos.dy = this.mouseData.pos.y - this.mouseData.pos.pre_y;
		this.mouseData.pos.pre_x = this.mouseData.pos.x;
		this.mouseData.pos.pre_y = this.mouseData.pos.y;
		for ( let i = 0; i < this.mouseData.press.length; ++i )
		{
			this.mouseData.trigger[ i ] = this.mouseData.press[ i ] && !this.mouseData.prev[ i ];
			this.mouseData.release[ i ] = !this.mouseData.press[ i ] && this.mouseData.prev[ i ];
			this.mouseData.prev[ i ] = this.mouseData.press[ i ];
			if ( this.mouseData.press[ i ] == this.keyState.on )
			{
				this.mouseData.press[ i ] = this.keyState.on2on;	// 受理済み
			}
			if ( this.mouseData.press[ i ] == this.keyState.on2off )
			{
				this.mouseData.press[ i ] = this.keyState.off;	// 受理前のリリースを状態に反映
			}
			// ボタン押下中の移動量
			if ( this.mouseData.press[ i ] )
			{
				this.mouseData.pos.drg_x[ i ] += this.mouseData.pos.dx;
				this.mouseData.pos.drg_y[ i ] += this.mouseData.pos.dy;
			} else
			{
				this.mouseData.pos.drg_x[ i ] = 0;
				this.mouseData.pos.drg_y[ i ] = 0;
			}
		}
		// ホイール
		// 前フレームからのホイール変化量を参照用変数へコピーして一時データをクリア
		this.mouseData.wheel.dx = this.mouseData.wheel.tdx;
		this.mouseData.wheel.dy = this.mouseData.wheel.tdy;
		this.mouseData.wheel.dz = this.mouseData.wheel.tdz;
		this.mouseData.wheel.tdx = 0;
		this.mouseData.wheel.tdy = 0;
		this.mouseData.wheel.tdz = 0;
		// 総スクロール量（デバッグ用）
		this.mouseData.wheel.wx = this.mouseData.wheel.dx;
		this.mouseData.wheel.wy = this.mouseData.wheel.dy;
		this.mouseData.wheel.wz = this.mouseData.wheel.dz;
	}

	checkKeyUse( e )
	{
		switch ( e.keyCode )
		{
			case this.keyScanCode.Left:
			case this.keyScanCode.Up:
			case this.keyScanCode.Right:
			case this.keyScanCode.Down:
			case this.keyScanCode.Space:
			case this.keyScanCode.Enter:
			case this.keyScanCode.Home:
			case this.keyScanCode.PageUp:
			case this.keyScanCode.PageDown:
				return true;
		}
		return false;
	}

	/* Key event handler */
	onKeyPress( e )
	{
		// キースキャンコードではなく、文字コード
	}
	onKeyDown( e )
	{
		// キースキャンコードで取得
		let i = e.keyCode;
		if ( 0 <= i && i < this.keyData.press.length )
		{
			if ( this.keyData.press[ i ] != this.keyState.on2on )
			{
				this.keyData.press[ i ] = this.keyState.on;
			}
		}
		if ( this.checkKeyUse( e ) )
			e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
	}
	onKeyUp( e )
	{
		// キースキャンコードで取得
		let i = e.keyCode;
		if ( 0 <= i && i < this.keyData.press.length )
		{
			if ( this.keyData.press[ i ] == this.keyState.on2on )
			{
				this.keyData.press[ i ] = this.keyState.off;	// ONをupdateで検出済み
			} else
				if ( this.keyData.press[ i ] == this.keyState.on )
				{
					this.keyData.press[ i ] = this.keyState.on2off;	// ONをupdateで受け取る前に離された
				}
		}
		if ( this.checkKeyUse( e ) )
			e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
	}

	/* Mouse event handler */
	onContextMenu( e )
	{
		e.preventDefault(); //右クリックでコンテキストメニューを出さない
	}
	onWheel( e )
	{
		this.mouseData.wheel.tdx += e.deltaX;
		this.mouseData.wheel.tdy += e.deltaY;
		this.mouseData.wheel.tdz += e.deltaZ;
		//e.deltaMode;	//0:px / 1:line / 2:page
		e.preventDefault(); //ホイールでスクロールしない
	}
	onMouseMove( e )
	{
		if ( this.canvas )
		{
			this.mouseData.pos.x = ( e.clientX + this.canvas.offsetLeft + document.body.scrollLeft );
			this.mouseData.pos.y = ( e.clientY + this.canvas.offsetTop + document.body.scrolTop );
			e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
		}
	}
	onMouseDown( e )
	{
		// e.buttonはどれか一つ
		// e.buttonsは同時押し対応だが未対応の環境がある
		let i = -1;
		switch ( e.button )
		{
			case 0: i = this.mouseBtn.left; break;
			case 1: i = this.mouseBtn.center; break;
			case 2: i = this.mouseBtn.right; break;
			default: return;
		}
		if ( this.mouseData.press[ i ] != this.keyState.on2on )
		{
			this.mouseData.press[ i ] = this.keyState.on;
		}
		e.preventDefault(); //ダブルクリック回避
	}
	onMouseUp( e )
	{
		// e.buttonはどれか一つ
		// e.buttonsは同時押し対応だが未対応の環境がある
		let i = -1;
		switch ( e.button )
		{
			case 0: i = this.mouseBtn.left; break;
			case 1: i = this.mouseBtn.center; break;
			case 2: i = this.mouseBtn.right; break;
			default: return;
		}
		if ( this.mouseData.press[ i ] == this.keyState.on2on )
		{
			this.mouseData.press[ i ] = this.keyState.off;	// ONをupdateで検出済み
		} else
			if ( this.mouseData.press[ i ] == this.keyState.on )
			{
				this.mouseData.press[ i ] = this.keyState.on2off;	// ONをupdateで受け取る前に離された
			}
		e.preventDefault(); //ダブルクリック回避
	}

	/* Touch event handler */
	/*タッチはワンボタンマウス扱いにしておく*/
	onTouchMove( e )
	{
		let cnt = e.touches.length;
		this.mouseData.pos.x = ( e.touches[ 0 ].pageX + canvas.offsetLeft + document.body.scrollLeft );
		this.mouseData.pos.y = ( e.touches[ 0 ].pageY + canvas.offsetTop + document.body.scrolTop );
		e.preventDefault(); //画面が動いたりジェスチャーが動作しないように
	}
	onTouchStart( e )
	{
		// 左ボタン扱い。マルチタッチ非対応
		let i = this.mouseBtn.left;
		if ( this.mouseData.press[ i ] != this.keyState.on2on )
		{
			this.mouseData.press[ i ] = this.keyState.on;
		}
		e.preventDefault(); //ダブルクリック回避
	}
	onTouchEnd( e )
	{
		// 左ボタン扱い。マルチタッチ非対応
		let i = this.mouseBtn.left;
		if ( this.mouseData.press[ i ] == this.keyState.on2on )
		{
			this.mouseData.press[ i ] = this.keyState.off;	// ONをupdateで検出済み
		} else
			if ( this.mouseData.press[ i ] == this.keyState.on )
			{
				this.mouseData.press[ i ] = this.keyState.on2off;	// ONをupdateで受け取る前に離された
			}
		e.preventDefault(); //ダブルクリック回避
	}
}
