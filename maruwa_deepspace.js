
new function ()
{
	let bgm_mode = 0;

	let move_background = false;	// 最小化/タブ切り替えで見えなくなっても動作するかどうか

	let game_pause = false;

	let base_spd = 1;
	let option = {
		speed_up_on: 0,
		speed_up: 0,
		speed_max: 32
	};

	let pokeel = null;// = new Pokeel();
	let resMan = null;// = new ResourceManager();
	let images = {};// = resMan.images;

	let chrs;
	let camera;
	let input;

	let canvas_w;
	let canvas_h;

	/* イベント：読み込み終了＝全体のスタート */
	if ( document.readyState == 'complete' )
	{
		bootstrap();
	}
	else
	{
		//window.addEventListener('load', bootstrap, false);
		window.onload = bootstrap;

	}

	function handleWindowResize( pokeel, w, h )
	{
		canvas_w = w;
		canvas_h = h;
		pokeel.setScreenSize( w, h );
		pokeel.init_update();
		pokeel.render();
		pokeel.redraw();
	}
	function handleVisibilityChange( pokeel )
	{
		if ( move_background !== true )
		{
			pokeel.paused = document.hidden || game_pause;
		}
	}
	function bootstrap()
	{
		pokeel = new Pokeel();
		pokeel.onloadprogress = handleLoadProgress.bind( this );
		pokeel.onloadcomplete = handleLoadCompete.bind( this );
		pokeel.onwindowresize = handleWindowResize.bind( this );
		pokeel.onvisibilitychange = handleVisibilityChange.bind( this );
		pokeel.onupdate = handleUpdate.bind( this );
		pokeel.custombgclear = handleCustomBgClear.bind( this );
		pokeel.onredraw = handleRedraw.bind( this );
		canvas_w = window.innerWidth;
		canvas_h = window.innerHeight;
		pokeel.attatchScreen( document );
		pokeel.setScreenSize( canvas_w, canvas_h );
		pokeel.setResource(
			{
				'image': {
					//	'bg': {
					//		file: [
					//			'img/METALGEAR2-199010-with-maruwa.jpg'
					//		]
					//	},
					'sero': {
						file: [
							'img/ぎょうちゅうセロファン.png'
						],
						opt: { base_scale: 1 }
					},
					'iruka': {
						file: [
							'img/gugure.png'
						],
						opt: { base_scale: 8 }
					},
					'maruwa': {
						file: [
							'img/丸和太郎2-1.png',
							'img/丸和太郎2-2.png',
							'img/丸和太郎2-3.png',
							'img/丸和太郎2-4.png',
							'img/丸和太郎2-5.png',
							'img/丸和太郎2-6.png',
							'img/丸和太郎2-7.png'
						],
						opt: { base_scale: 1 }
					},
					'maruwa2': {
						file: [
							'img/丸和太郎3-1.png',
							'img/丸和太郎3-2.png',
							'img/丸和太郎3-3.png',
							'img/丸和太郎3-4.png',
							'img/丸和太郎3-5.png',
							'img/丸和太郎3-6.png',
							'img/丸和太郎3-7.png'
						],
						opt: { base_scale: 1 }
					},
					'maruwa_head': {
						file: [
							'img/丸和太郎HEAD-1.png',
							'img/丸和太郎HEAD-2.png',
							'img/丸和太郎HEAD-3.png',
							'img/丸和太郎HEAD-4.png',
							'img/丸和太郎HEAD-5.png'
						],
						opt: { base_scale: 1 }
					},
					'yasumi': {
						file: [
							'img/EDGE1-parts-p1.png',
							'img/EDGE1-parts-p2.png',
							'img/EDGE1-parts-p3.png',
							'img/EDGE1-parts-p4.png',
							'img/EDGE1-parts-p5.png'
						],
						opt: {
							base_scale: 1,
							anim_list: [
								0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 3, 2, 1,
								0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
								0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
								0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
						}
					}
				},
				'audio' : {
					'audio/relics880':null,
					'audio/relics881':null,
					'audio/relics98amd981':null,
					'audio/relics98amd982':null,
					'audio/bgm_maoudamashii_8bit08':{volume:0.25},
					'audio/bgm_maoudamashii_8bit11':{volume:0.25},
					'audio/bgm_maoudamashii_healing11b':{volume:0.25}
				}
			}
		);
		pokeel.run();
	}

	function handleLoadProgress(ratio, ctx)
	{
		ctx.save();
		const message = 'LOADING: ' + parseInt((ratio) * 100) + ' %';
		const fontSize = 24;

		//ctx.font = "bold " + fontSize + "px sans-serif";
		//ctx.font = "bold " + fontSize + "px monospace";
		ctx.font = '' + fontSize + 'px "gf"';
		ctx.textBaseline = "top";

		let metrix = ctx.measureText( message );
		let x = ( canvas_w - metrix.width ) / 2;
		let y = (canvas_h - fontSize) / 2;

		ctx.save();
		ctx.fillStyle = "#000000";
		ctx.fillRect( x - 40, y - 2, metrix.width + 80, fontSize + 4 );
		ctx.restore();

		ctx.fillStyle = '#e7bd00';
		ctx.fillText( message, x, y );
		ctx.restore();
	}
	function handleLoadCompete(pokeel)
	{
		create_chara(pokeel);

		pokeel.audios.masterVolume = 0.25;
		pokeel.audios.bgmVolume = 0.5;

		bgmChange();
	}
	function bgmChange()
	{
		switch (bgm_mode)
		{
		case 0:
			pokeel.audios.fadeOutBgm(1);
			break;
		case 1:
			if (option.speed_up_on)
			{
				pokeel.audios.playBgm('relics881',true);
			}
			else{
				pokeel.audios.playBgm('relics880');
			}
			break;
		case 2:
			if (option.speed_up_on)
			{
				pokeel.audios.playBgm('relics98amd982',true);
			}
			else{
				pokeel.audios.playBgm('relics98amd981');
			}
			break;
		case 3:
			if (option.speed_up_on)
			{
				pokeel.audios.playBgm('bgm_maoudamashii_8bit08',true);
			}
			else{
				pokeel.audios.playBgm('bgm_maoudamashii_8bit11');
				//pokeel.audios.playBgm('bgm_maoudamashii_healing11b');
			}
			break;
		}
	}
	function create_chara(pokeel)
	{
		images = pokeel.resource.images;
		chrs = pokeel.chrs;
		camera = pokeel.camera;
		input = pokeel.input;

		/*Charaクラスに登録*/
		chrs.list = new Array();

		if ( 1 )
		{
			chrs.yasumi = new Array( 2 );
			for ( let i = 0; i < chrs.yasumi.length; ++i )
			{
				chrs.yasumi[ i ] = new Sprite( "yasumi-" + i, images[ 'yasumi' ] );
				chrs.yasumi[ i ]._start = start_zoomobj_rot;
				chrs.yasumi[ i ]._update = update_zoomobj_rot;
				chrs.yasumi[ i ]._translator = camera;
				chrs.yasumi[ i ].alpha = 1;//0.1 + Math.random() * 0.3;
				chrs.yasumi[ i ]._pos.layer_id = 255;
				chrs.list.push( chrs.yasumi[ i ] );
			}
		}

		chrs.iruka = new Array( 16 );
		for ( let i = 0; i < chrs.iruka.length; ++i )
		{
			chrs.iruka[ i ] = new Sprite( "iruka-" + i, images[ 'iruka' ] );
			chrs.iruka[ i ]._start = start_zoomobj;
			chrs.iruka[ i ]._update = update_zoomobj;
			chrs.iruka[ i ]._translator = camera;
			chrs.iruka[ i ].alpha = 1;//0.1 + Math.random() * 0.3;
			chrs.list.push( chrs.iruka[ i ] );
		}

		chrs.maruwa_head = new Array( 100 );
		for ( let i = 0; i < chrs.maruwa_head.length; ++i )
		{
			chrs.maruwa_head[ i ] = new Sprite( "maruwa_head-" + i, images[ 'maruwa_head' ] );
			chrs.maruwa_head[ i ]._start = start_zoomobj_rot;
			chrs.maruwa_head[ i ]._update = update_zoomobj_rot;
			chrs.maruwa_head[ i ]._translator = camera;
			chrs.maruwa_head[ i ].alpha = 1;//0.1 + Math.random() * 0.3;
			chrs.list.push( chrs.maruwa_head[ i ] );
		}

		chrs.maruwa2 = new Array( 32 );
		for ( let i = 0; i < chrs.maruwa2.length; ++i )
		{
			chrs.maruwa2[ i ] = new Sprite( "maruwa2-" + i, images[ 'maruwa2' ] );
			chrs.maruwa2[ i ]._start = start_zoomobj_rot;//start_simplemove;
			chrs.maruwa2[ i ]._update = update_zoomobj_rot;//update_simplemove;
			chrs.maruwa2[ i ]._translator = camera;
			chrs.maruwa2[ i ].alpha = 0.5;//0.1 + Math.random() * 0.3;
			chrs.list.push( chrs.maruwa2[ i ] );
		}

		chrs.maruwa = new Array( 100 );
		for ( let i = 0; i < chrs.maruwa.length; ++i )
		{
			chrs.maruwa[ i ] = new Sprite( "maruwa-" + i, images[ 'maruwa' ] );
			chrs.maruwa[ i ]._start = start_zoomobj_rot;//start_simplemove;
			chrs.maruwa[ i ]._update = update_zoomobj_rot;//update_simplemove;
			chrs.maruwa[ i ]._translator = camera;
			chrs.maruwa[ i ].alpha = 0.5;//0.1 + Math.random() * 0.3;
			chrs.list.push( chrs.maruwa[ i ] );
		}

		chrs.sero = new Array( 8 );
		for ( let i = 0; i < chrs.sero.length; ++i )
		{
			chrs.sero[ i ] = new Sprite( "sero-" + i, images[ 'sero' ] );
			chrs.sero[ i ]._start = start_simplemove;
			chrs.sero[ i ]._update = update_simplemove;
			chrs.sero[ i ]._translator = camera;
			chrs.sero[ i ].alpha = 0.5;//0.1 + Math.random() * 0.3;
			chrs.list.push( chrs.sero[ i ] );
		}

		// 描画順用キャラリスト
		chrs.draw_list = new Array( chrs.list.length );
		for ( let i = 0; i < chrs.list.length; ++i )
		{
			chrs.draw_list[ i ] = chrs.list[ i ];
		}
	}


	/*イベント：Update処理*/
	function handleUpdate (pokeel)
	{
		// キー操作色々
		if ( 1 )
		{
			if ( input.keyData.trigger[ input.keyScanCode.Home ] )
			{
				camera.zoom = 1;
			}
			else
				if ( input.keyData.press[ input.keyScanCode.PageUp ] )
				{
					camera.zoom += 0.0125;
				}
				else
					if ( input.keyData.press[ input.keyScanCode.PageDown ] )
					{
						camera.zoom -= 0.0125;
					}

			if ( input.mouseData.trigger[ input.mouseBtn.center ] )
			{
				camera.zoom = 1;
				//	camera.fov = 90;
			}
			if ( input.mouseData.wheel.dy )
			{
				camera.zoom -= 0.0005 * input.mouseData.wheel.dy;
				//	camera.fov -= 0.03125 * input.mouseData.wheel.dy;
			}

			if ( input.keyData.trigger[ input.keyScanCode.Pause ] )
			{
				game_pause = !game_pause;
				pokeel.paused = game_pause;
			}


			let bgm_change = false;

			if ( input.mouseData.trigger[ input.mouseBtn.left ] || input.keyData.trigger[ input.keyScanCode.Space ] )
			{
				option.speed_up_on = option.speed_up_on ? 0 : 1;	// 切り替え
				bgm_change = true;
			}

			if ( input.mouseData.trigger[ input.mouseBtn.right ] || input.keyData.trigger[ input.keyScanCode.Enter ] )
			{
				bgm_mode = (++bgm_mode) % 4;
				bgm_change = true;
			}

			if (bgm_change)
			{
				bgmChange();
			}

			// 高速モード/通常モード
			if ( option.speed_up_on )
			{
				if ( option.speed_up < option.speed_max * base_spd)
				{
					option.speed_up += 1;
					option.speed_up = Math.min( option.speed_up, option.speed_max * base_spd);
				}
			} else
			{
				if ( option.speed_up > 0 )
				{
					option.speed_up -= 1;
					option.speed_up = Math.max( option.speed_up, 0 );
				} else
					if ( option.speed_up < 0 )
					{
						option.speed_up += 1;
						option.speed_up = Math.min( option.speed_up, 0 );
					}
			}
		}
	}

	/*＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝*/
	/*描画*/
	let b_i = 0;
	let graysccale = new Array();
	for ( let i = 0; i < 256; ++i )
	{
		graysccale.push( "rgb(" + i + "," + i + "," + i );
	}

	function handleCustomBgClear(pokeel, ctx)
	{
		let canvas = ctx.canvas;

		if ( option.speed_up_on )
		{
			b_i += 4;
		} else
		{
			b_i -= 1;
		}
		b_i = Math.clamp( b_i, 0, 255 );
		const fillColor = graysccale[ parseInt( b_i ) ];
		//const fillColor = "rgba(0, 0, 0, 0.05)";
		//const fillColor = "rgba(256, 256, 256, 0.05";

		ctx.save();

		/*画面クリア*/
		if ( 0 )
		{
			ctx.clearRect( 0, 0, canvas.width, canvas.height );
		} else
		{
			ctx.save();
			ctx.fillStyle = fillColor;
			//	ctx.globalAlpha = 0.2;
			ctx.globalAlpha = 0.1;
			//	ctx.globalAlpha = 0.05;
			ctx.fillRect( 0, 0, canvas.width, canvas.height );
			ctx.restore();
		}

		use_effect = 1//!(option.speed_up);
		if ( use_effect ) // 太陽風エフェクトtest
		{
			const bl_mode = 2;
			const spd = -4;
			if ( bl_mode )
			{
				ctx.save();
				ctx.globalAlpha = 0.25;
				ctx.drawImage( canvas, spd, spd, canvas.width - spd * 2, canvas.height - spd * 2
					, 0, 0, canvas.width - spd, canvas.height - spd
				);
				ctx.restore();
			}
		}

		//	ctx.drawImage(images['bg'], 0, 0 );
	}
	let text_color = 0;
	function handleRedraw(pokeel, ctx)
	{
		if ( 1 )
		{
			const text_colors = [ "#ff6060", "#ffb040", "#ffff50", "white", "#80ff80", "#40a0ff", "#e050e0", "black" ];
			if ( 1 )
			{
				ctx.save();
				const message = option.speed_up_on ?
					"- WARP!! -" : "CRUISING";
				const fontSize = 24;

				text_color = option.speed_up_on ? ( ( text_color + 0.25 ) % text_colors.length ) : 3;

				//ctx.font = "bold " + fontSize + "px sans-serif";
				//ctx.font = "bold " + fontSize + "px monospace";
				ctx.font = '' + fontSize + 'px "gf"';
				ctx.textBaseline = "top";

				let metrix = ctx.measureText( message );
				let x = ( canvas_w - metrix.width ) / 2;
				let y = 3;// (canvas_h - fontSize) / 2;

				ctx.save();
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				ctx.fillRect( x - 40, y - 2, metrix.width + 80, fontSize + 4 );
				ctx.restore();

				ctx.fillStyle = text_colors[ parseInt( text_color ) % text_colors.length ];
				ctx.fillText( message, x, y );
				ctx.restore();
			}

			if ( 1 )
			{
				ctx.save();
				const help_message = "[CLICK/SPACE:Warp!]"
					+ " [PageUp-Down/Home:Zoom(" + Math.round( camera.zoom * 100 ) + "%)/reset]"
					//+ " [Wheel:Fov(" + Math.round( camera.fov ) + ")]"
					;
				const fontSize = 12;
				//ctx.font = "normal " + fontSize + "px sans-serif";
				//ctx.font = "normal " + fontSize + "px monospace";
				ctx.font = 'normal ' + fontSize + 'px "gf"';
				ctx.textBaseline = "top";

				let metrix = ctx.measureText( help_message );
				let x = ( canvas_w - metrix.width ) / 2;
				let y = ( canvas_h - fontSize ) - 4;
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				ctx.fillRect( x - 40, y - 2, metrix.width + 80, fontSize + 4 );
				ctx.fillStyle = "white";
				ctx.fillText( help_message, x, y );
				ctx.restore();
			}
		}
	}

	/*==============================================*/
	/*左移動開始処理*/
	function start_simplemove ( c )
	{
		c._pos.z = camera.farPos.z * 0.5 * Math.random();
		let scale = camera.calcScale( c._pos.z );
		let rev_scale = 1 / scale;
		let w = c.image.width;
		let h = c.image.height;
		let cw = canvas_w;
		let ch = canvas_h;
		c._pos.x = Math.random() * ( cw + w ) - w * 0.5;
		c._pos.y = Math.random() * ( ch + h * 0.25 ) - h * 0.125;
		c._pos.x = ( c._pos.x - canvas_w * 0.5 ) * rev_scale + canvas_w * 0.5;
		c._pos.y = ( c._pos.y - canvas_h * 0.5 ) * rev_scale + canvas_h * 0.5;

		c.animeFrame = parseInt( Math.random() * c.animeCount );
		c.animeSpeed = 4;//Math.random() * 2 + 2;

		c.rotate = Math.random() * 360;
		c.rot_speed = Math.random() * -1 - 0.04;//* 2 - 1;

		//	c.alpha = c.alpha * (1 - c.scale * 0.5);
		c.a_cnt = Math.random() * 0.5;
		c.a_spd = ( 1 + Math.random() * 2 ) * 0.25;

		c.translate();
	}
	/*左移動毎フレーム処理*/
	function update_simplemove ( c )
	{
		let pos = c.pos;
		let vx = - c.scale * 3 * base_spd;
		if ( option.speed_up )
		{
			vx *= option.speed_up;
		}
		pos.x += vx;
		tpos = c.translated_pos;

		//	if (tpos.x < -c.image.width)
		let scale = tpos.scale;
		let rev_scale = 1 / scale;
		let cw = canvas_w * rev_scale;
		let ch = canvas_h * rev_scale;
		let w = c.image.width * scale;
		let h = c.image.height * scale;
		if ( ( c._pos.z > camera.farPos.z )
			|| ( c._pos.z < camera.nearPos.z )
			|| ( tpos.x < -w )
			|| ( tpos.x > cw + w )
			|| ( tpos.y < -h )
			|| ( tpos.y > ch + h )
		)
		{
			{
				start_simplemove( c );
				pos = c.pos;
				tpos = c.translated_pos
			}
			pos.x = canvas_w + c.image.width * 0.5;
			pos.x /= tpos.scale;
		}
		c.pos = pos;
		c.rotate = c.rotate + c.rot_speed;
		c.a_cnt += c.a_spd * 0.01;
		if ( c.a_cnt > 4 ) c.a_cnt = 0;
		c.alpha = c.a_cnt > 2 ? 0 : ( c.a_cnt > 1 ? ( 2 - c.a_cnt ) : c.a_cnt ) * 0.8;
	}

	/*中心ズームタイプ開始時処理*/
	function start_zoomloop ( c )
	{
		start_zoomloop_( c );
		update_zoomobj( c );
		c.translate();
	}
	function start_zoomloop_ ( c )
	{
		c.z_fact = 0;
		c.z_spd = 4 * base_spd;
		c.animeFrame = parseInt( Math.random() * c.animeCount );
		c.animeSpeed = 4;//Math.random() * 2 + 2;
	}
	/*中心ズームタイプ毎フレーム処理*/
	function update_zoomloop ( c )
	{
		let cx = canvas_w / 2;
		let cy = canvas_h / 2;
		let x = Math.random() * 10 - 5;
		let y = Math.random() * 10 - 5;
		let z = camera.farPos.z;

		const max_z = camera.farPos.z + camera.eyelen - camera.near;

		if ( option.speed_up )
		{
			c.z_fact += c.z_spd * option.speed_up * 0.25;
		} else
		{
			c.z_fact += c.z_spd;
		}
		if ( c.z_fact > max_z * 2 )
		{
			c.z_fact = 0;
		}
		if ( c.z_fact >= max_z )
		{
			z -= max_z + max_z - c.z_fact;
		} else
		{
			z -= c.z_fact;
		}

		c.setPos( cx + x * c.scale, cy + y * c.scale, z );
	}

	/*ズームタイプ開始時処理*/
	let far_len_range = 0.875;
	let far_rect_range = 0.75;
	function start_zoomobj ( c )
	{
		start_zoomobj_( c );
		update_zoomobj( c );
		c.translate();
	}
	function start_zoomobj_ ( c )
	{

		c._scale = 1;//0.25 + Math.random() * 1.75;
		if ( c._imgs.base_scale )
		{
			c._scale *= c._imgs.base_scale;
		}

		c._pos.z = camera.farPos.z
		c._pos.z *= ( 1 - far_len_range ) + far_len_range * Math.random();
		let scale = camera.calcScale( c._pos.z );
		let rev_scale = 1 / scale;
		let cw = canvas_w;
		let ch = canvas_h;
		let w = c.image.width;
		let h = c.image.height;
		let range = 0.5;
		c._pos.x = Math.random() * ( cw + w ) - w * 0.5;
		c._pos.y = Math.random() * ( ch + h * 0.25 ) - h * 0.125;
		c._pos.x = ( c._pos.x - canvas_w * 0.5 ) * rev_scale * far_rect_range + canvas_w * 0.5;
		c._pos.y = ( c._pos.y - canvas_h * 0.5 ) * rev_scale * far_rect_range + canvas_h * 0.5;

		c.animeFrame = parseInt( Math.random() * c.animeCount );
		c.animeSpeed = Math.random() * 8 + 2;

		c.z_spd = -( 1 + 15 * Math.random() );
		c.z_spd *= base_spd;
	}
	function start_zoomobj_rot ( c )
	{
		c.rotate = Math.random() * 360;
		c.rot_speed = Math.random() * 4 - 2;
		start_zoomobj( c );
	}
	/*ズームタイプ毎フレーム処理*/
	function update_zoomobj ( c )
	{
		if ( option.speed_up )
		{
			c._pos.z += c.z_spd * option.speed_up * 0.25;
		} else
		{
			c._pos.z += c.z_spd;
		}

		c.translate();
		let tpos = c.translated_pos;
		let scale = tpos.scale;
		let rev_scale = 1 / scale;
		let cw = canvas_w * rev_scale;
		let ch = canvas_h * rev_scale;
		let w = c.image.width * scale;
		let h = c.image.height * scale;
		if ( ( c._pos.z > camera.farPos.z )
			|| ( c._pos.z < camera.nearPos.z )
			|| ( tpos.x < -w )
			|| ( tpos.x > cw + w )
			|| ( tpos.y < -h )
			|| ( tpos.y > ch + h )
		)
		{
			// 再初期化
			c._pos.z = camera.farPos.z;
			scale = camera.calcScale( c._pos.z );
			rev_scale = 1 / scale;
			w = c.image.width;
			h = c.image.height;
			cw = canvas_w;
			ch = canvas_h;
			let range = 0.5;
			c._pos.x = Math.random() * ( cw + w ) - w * 0.5;
			c._pos.y = Math.random() * ( ch + h * 0.25 ) - h * 0.125;
			c._pos.x = ( c._pos.x - canvas_w * 0.5 ) * rev_scale * far_rect_range + canvas_w * 0.5;
			c._pos.y = ( c._pos.y - canvas_h * 0.5 ) * rev_scale * far_rect_range + canvas_h * 0.5;
			c.translate();
			tpos = c.translated_pos;
		}

		//let rz = ((camera.farPos.z - c._pos.z) / (camera.farPos.z - camera.nearPos.z)); // 距離とリニア 急激に濃くなる
		let rz = tpos.scale * 1.25; // 拡大率 1/距離の曲線変化 : 自然
		c._alpha = Math.clamp( rz, 0, 1 );
	}
	function update_zoomobj_rot ( c )
	{
		c.rotate = c.rotate + c.rot_speed;
		update_zoomobj( c );
	}
	/*================================*/



}

