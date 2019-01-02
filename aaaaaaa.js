class TJScrollTask {
	constructor(tjDeck, targetL, duration) {
		this.tjDeck = tjDeck;
		this.$t = tjDeck.$wrap;
		this.x = targetL;
		this.d = duration;
		this.sl = tjDeck.wrapL;
		this.sTime = Date.now();
		this.ended = false;

		this._bindAnim = this._anim.bind(this);


		// �ڕW����ʊO�Ȃ珈�������Ȃ�
		var $clms = tjDeck.getClms();
		if (targetL < 0 || targetL > $clms[0].offsetWidth * ($clms.length-1)) {
			this.ended = true;
		} else {
			requestAnimationFrame(this._bindAnim);
		}
	}

	stop() {
		if (this.ended) return;
		this.ended = true;
		cancelAnimationFrame(this._bindAnim);
	}

	_anim() {
		if (this.ended) return;
		var t = (Date.now()-this.sTime)/this.d,
			b = this.sl,
			c = this.x - this.sl,
			d = 1;
		if (t > 1 && !this.ended) {
			this.stop();
			t = 1;
		}
		this.tjDeck.scrollWrap(this._easeOut(t, b, c, d));
		if (t < 1) requestAnimationFrame(this._bindAnim);
	}
	_easeOut(t, b, c, d) {
		t /= d;
		t = t-1;
		return c*(t*t*t + 1) + b;
	}
}

class TJDeck {
	constructor() {
		this.version = "0.0.9";
		this.$wrap = document.querySelector(".js-app-columns");
		this.wrapL = 0;
		this.scrollTask = null;
		this.options = this.getOptionObj();
		this.setOptionFromObj(this.options);

		this.$options = this.createOptionPanel();
		document.body.appendChild(this.$options);

		this.updateBlur();
		this.updateLight();
	}
	getOption(name, def) {
		var val = localStorage.getItem("tj_deck_"+name);
		return !val? def:val=="true";
	}
	getOptionObj() {
		return {
			light: this.getOption("light", true),
			light_clm: this.getOption("light_clm", false),
			blur: this.getOption("blur", false)
		}
	}
	setOption(name, value) {
		localStorage.setItem("tj_deck_"+name, value);
	}
	setOptionFromObj(obj) {
		var keys = Object.keys(obj);
		for (var i=0; i < keys.length; i++) {
			this.setOption(keys[i], obj[keys[i]]);
		}
	}
	getClms() {
		return this.$wrap.querySelectorAll("section.column");
	}
	back() {

		// TJDeck �ݒ��ʂ��\�����Ȃ�����ďI��
		if (this.$options.style.display != "none") {
			this.updateOption();
			this.hideOptionPanel();
			return;
		}

		// ���[�_�����\�����Ȃ�����ďI��
		var $mdlDismiss = document.querySelector(".mdl-dismiss");
		if ($mdlDismiss) {
			$mdlDismiss.click();
			return;
		}

		// �c�C�[�g�p�l�����\�����Ȃ�����ďI��
		if (this.isShownDrawer()) {
			this.hideDrawer();
			return;
		}

		// �J�����ɖ߂�{�^��������Ή����ďI��
		var $clm = this.getClosestColumn(this.wrapL);
		var $backToHome = $clm.querySelector(".js-column-back");
		if ($backToHome) {
			$backToHome.click();
			return;
		}

	}
	// �����\�����Ȃ�true
	isShownItem() {
		return !!document.querySelector(".mdl-dismiss") || this.isShownDrawer();
	}
	// �h�����[���\�����Ȃ�true
	isShownDrawer() {
		return !!document.querySelector(".hide-detail-view-inline");
	}
	// �h�����[���\���ɂ���
	hideDrawer() {
		var $btn = document.querySelector(".js-hide-drawer");
		if ($btn) $btn.click();
	}
	// �h�����[��\������
	showDrawer() {
		var $btn = document.querySelector(".js-show-drawer");
		if ($btn) $btn.click();
	}

	// �߂�{�^�����Ǘ�����
	manageBack() {
		history.pushState(null, null, "");
		window.addEventListener("popstate", function (event) {
			this.back();
			history.pushState(null, null, "");
			
		}.bind(this));
	}

	observeModals() {
		var observer = new MutationObserver(function (records) {
			var record, $modal;
			for (var i=0; i < records.length; i++) {
				record = records[i];
				for (var n=0; n < record.addedNodes.length; n++) {
					$modal = record.addedNodes[i];
					this.stopAnkerFromModal($modal);
				}
			}
		}.bind(this));
		var options = {
			attributes: false,
			characterData: true,
			childList: true
		};
		
		var $targets = document.querySelectorAll(".js-modals-container, .js-modal");

		for (var i=0; i < $targets.length; i++) {
			observer.observe($targets[i], options);
		}

	}

	stopAnkerFromModal($modal) {
		var $ankers = $modal.querySelectorAll("a"),
			$a;
		var cb = function (event) {
			event.preventDefault();
			event.target.removeEventListener("click", cb);
			return false;
		} 
		for (var i=0; i < $ankers.length; i++) {
			$a = $ankers[i];
			if ($a.href && $a.href.match(/#$/)) {
				$a.addEventListener("click", cb);
			}
		}
	}

	// �J�����̑������Ď�����
	observeClms() {
		var observer = new MutationObserver(function (records) {
			var $targetClm;

			// ���R�[�h�̐������J��Ԃ�
			var record;
			for (var i=0; i < records.length; i++) {
				record = records[i];

				// �ǉ����ꂽ�J����������΃^�[�Q�b�g�ɂ���
				if (record.addedNodes[0]) {
					$targetClm = record.addedNodes[0];
				}

				// �폜���ꂽ�J����������ΑO��̃J�������^�[�Q�b�g�ɂ���
				// �Ȃ���΍ŏ��̃J����
				if (record.removedNodes[0]) {
					if (record.nextSibling instanceof Element) {
						$targetClm = record.nextSibling;
					}
					else if (record.previousSibling instanceof Element) {
						$targetClm = record.previousSibling;
					}
					else {
						$targetClm = this.getClms()[0];
					}
				}
			}

			// �^�[�Q�b�g������΃X�N���[������
			if ($targetClm && $targetClm instanceof Element) {
				this.scrollWrapAnim($targetClm.offsetLeft);
			}
		}.bind(this));

		var options = {
			attributes: false,
			characterData: false,
			childList: true
		};

		observer.observe(this.$wrap, options);
	}

	// ���X�N���[�����Ǘ�����
	manageScroll() {
		var sPos;
		var sTime = Date.now();
		var prevPos;
		var $prevClm;
		var flag = null;// -1:�J�n�O, 0:�c����, 1:������


		// �f�t�H���g�̃X�N���[�����~�߂�
		document.querySelector(".js-app-columns-container").addEventListener("scroll", function (event) {
			event.target.scrollLeft = 0;
		}.bind(this));


		// �^�b�`�X�^�[�g
		document.querySelector(".js-app-columns").addEventListener("touchstart", function (event) {
			if (event.touches.length > 1 || this.isShownItem()) return;
			sPos = this._getPosObj(event);
			prevPos = sPos;
			flag = -1;
			sTime = Date.now();
			$prevClm = this.getClosestColumn(this.wrapL);
		}.bind(this));

		window.addEventListener("touchmove", function (event) {
			if (!flag) return;
			if (flag < 0) {
				var pos = this._getPosObj(event);
				if (Math.abs(pos.x - sPos.x) < Math.abs(pos.y - sPos.y)) {
					flag = 0;
					return;
				} else {
					flag = 1;
				}
			}
			if (flag == 1) {
				if (this.scrollTask) this.scrollTask.stop();
				var pos = this._getPosObj(event);
				prevPos = pos;
				if (!this.options.light_clm) {// �y�ʔł���Ȃ���Γ�����
					this.scrollWrap(this.wrapL + prevPos.x - pos.x);
				}
			}
		}.bind(this));
		window.addEventListener("touchend", function (event) {
			if (flag < 1) return;
			flag = null;
			var time = Date.now(),
				pos = prevPos,
				distance = sPos.x - pos.x;
			
			var $targetClm;
			// �X���C�v��
			if (Math.abs(distance) / (time-sTime) >= 0.5) {
				if (distance > 0) {
					$targetClm = $prevClm.nextElementSibling;
					this.hideMenu();
				} else {
					$targetClm = $prevClm.previousElementSibling;
					if (!$targetClm) this.showMenu();
				}
			}
			else {
				$targetClm = this.getClosestColumn(this.wrapL);
			}
			if ($targetClm && $targetClm instanceof Element) {
				this.scrollWrapAnim($targetClm.offsetLeft);
			}
		}.bind(this));
	}

	scrollWrapAnim(left) {
		if (this.scrollTask) this.scrollTask.stop();

		this.scrollTask = new TJScrollTask(this, left, this.options.light_clm?0:500);
	}

	// �w��ʒu�܂ŃX�N���[��
	scrollWrap(left) {
		var $clms = this.getClms();
		// ��ʊO�͏������Ȃ�
		if (left < 0 || left > $clms[0].offsetWidth * ($clms.length-1) || !isFinite(left)) return;
		this.$wrap.style.transform = `translateX(${-left}px)`;
		this.wrapL = left;
	}

	getClosestColumn(left) {
		var $clms = this.getClms();
		for (var i=0; i < $clms.length; i++) {
			var distance =  Math.abs(left - $clms[i].offsetLeft);
			if (distance <= $clms[i].offsetWidth/2) {
				return $clms[i];
			}
		}
		return $clms[$clms.length-1];
	}
	
	_getPosObj(event) {
		return {
			x: event.touches[0].pageX,
			y: event.touches[0].pageY
		}
	}

	hideMenu() {
		document.body.classList.add("tj_hide_menu");
	}
	showMenu() {
		document.body.classList.remove("tj_hide_menu");
	}

	showTJSetting() {
		
	}

	addTJNav() {
		var $nav = document.createElement("nav");
		$nav.classList.add("tj_nav");

		$nav.appendChild(this.createTweetBtn());
		$nav.appendChild(this.createSettingBtn());

		document.querySelector(".js-app-content").appendChild($nav);
	}

	createTweetBtn() {
		var $btn = document.createElement("button");
		$btn.classList.add("tj_tweet_btn", "Button", "Button--primary", "tweet-button");
		$btn.innerHTML = `<i class="Icon icon-compose icon-medium"></i>`;
		$btn.addEventListener("click", this.showDrawer.bind(this));
		return $btn;
	}

	createSettingBtn() {
		var $btn = document.createElement("a");
		$btn.classList.add("tj_setting_btn");
		$btn.href = "javascript:void(0)";
		$btn.innerHTML = `<i class="Icon icon-settings"></i>`;
		$btn.addEventListener("click", this.showOptionPanel.bind(this));
		return $btn;
	}

	createOptionPanel() {
		var $panel = document.createElement("div");
		$panel.classList.add("tj_options");
		$panel.style.display = "none";
		$panel.innerHTML =
`
<p class="title">TJDeck �ݒ�</p>
<div>
	<label for="tj_ops_light">��{�A�j���[�V�������Ȃ���:</label>
	<input type="checkbox" name="tj_ops_light" id="tj_ops_light">
</div>
<div>
	<label for="tj_ops_light_clm">�J�����؂�ւ��A�j���[�V�������Ȃ���:</label>
	<input type="checkbox" name="tj_ops_light_clm" id="tj_ops_light_clm">
</div>
<div>
	<label for="tj_ops_blur">�J�������ڂ���(�B�e�p):</label>
	<input type="checkbox" name="tj_ops_blur" id="tj_ops_blur">
</div>
<div>
	<p>Script Version: ${this.version}</p>
</div>
<div>
	<a href="javascript:void(0)" class="tj_ops_close">����</a>
</div>
`;
		$panel.querySelector(".tj_ops_close").addEventListener("click", function () {
			this.updateOption();
			this.hideOptionPanel();
		}.bind(this));
		return $panel;
	}

	hideOptionPanel() {
		var $panel = this.$options;
		$panel.style.display = "none";
	}
	showOptionPanel() {
		var $panel = this.$options;
		this.updateOptionPanel($panel);
		$panel.style.display = "";
	}

	updateOptionPanel() {
		var $panel = this.$options;
		["light", "light_clm", "blur"].forEach(function(key) {
			var $input = $panel.querySelector("#tj_ops_"+key);
			$input.checked = this.options[key];
		}.bind(this));
	}

	updateOption() {
		var $panel = this.$options;
		["light", "light_clm", "blur"].forEach(function(key) {
			var $input = $panel.querySelector("#tj_ops_"+key);
			this.options[key] = $input? $input.checked:false;
		}.bind(this));
		this.setOptionFromObj(this.options);

		this.updateBlur();
		this.updateLight();
	}

	updateBlur() {
		if (this.options.blur) {
			this.$wrap.classList.add("tj_blur");
		} else {
			this.$wrap.classList.remove("tj_blur");
		}
	}

	updateLight() {
		if (this.options.light) {
			document.body.classList.add("tj_light");
		} else {
			document.body.classList.remove("tj_light");
		}
	}
	
	manageStyle() {
		this.addStyle();
		var prevWidth = window.innerWidth;
		window.addEventListener("resize", function () {
			// �����Ȃ珈�����Ȃ�
			if (prevWidth == window.innerWidth) return;
			var $style = document.querySelector("#tj_deck_css");
			if ($style) $style.remove();
			this.addStyle();
			this.scrollWrap(this.wrapL * (window.innerWidth / prevWidth));
			prevWidth = window.innerWidth;
		}.bind(this));
	}

	refreshStyle() {
	}

	addStyle() {
		var $head = document.querySelector("head"),
			$style = document.createElement("style");
		$style.type = "text/css";
		$style.id = "tj_deck_css";
		$style.innerHTML =
`
html {
	/*overscroll-behavior: none; �v���_�E���Ń����[�h�����Ȃ� */
}

body.tj_light,
body.tj_light * {
	transition-duration: 0ms!important;
}
body.tj_light .inline-reply {
	/* 0�ɂ���ƃA�j���[�V�����C�x���g�����������ɓ��삪���������Ȃ�̂�1ms */
	transition-duration: 1ms!important;
}

.js-column-options {
	display: none!important;
}
.is-options-open .js-column-options {
	display: block!important;
}

/* TJDeck �I�v�V�����p�l�� */
.tj_options {
	position: fixed;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	padding: 1em;
	background: #fff;
	color: #222;
	z-index: 300;
}
.tj_options .title {
	margin-bottom: 1em;
	font-size: 1.1em;
	font-weight: bold;
	text-align: center;
}
.tj_options > div {
	margin: 1em 0;
}
.tj_options label,
.tj_options input {
	display: inline-block!important;
	margin: 0!important;
	vertical-align: middle!important;
}


/* �T�C�h���j���[�̕\���ؑ� */
.js-app-header {
	position: fixed!important;
}
.tj_hide_menu .js-app-header {
	transform: translateX(-50px);
}

/* ���C���̈ʒu�����[�� */
.js-app-content {
	left: 0!important;
}


/* �T�C�h�o�[���o����i�r���B�� */
.hide-detail-view-inline .tj_nav {
	display: none;
}

.tj_tweet_btn {
	position: fixed!important;
	width: 60px!important;
	height: 60px!important;
	bottom: 1em!important;
	right: 1em!important;
	padding: 0;
	background-color: #1da1f2;
	color: #fff;
	border-radius: 36px;
	font-size: 16px;
	line-height: 1em;
	text-align: center;
	box-shadow: 1px 1px 5px rgba(0, 0, 0, .5);
	z-index: 200;
}
.tj_tweet_btn .icon-compose,
.tj_setting_btn .icon-settings {
	display: inline-block;
	margin-top: 0;
	font-size: 20px!important;
}
.tj_setting_btn {
	position: fixed;
	width: 50px;
	height: 50px;
	top: 0!important;
	right: 40px!important;
	background-color: transparent;
	color: #333;
	text-align: center;
	box-shadow: none;
	z-index: 200;
}
.tj_setting_btn > i.icon-settings {
	margin-top: -2px;
	line-height: 50px;
}

.application {
	z-index: auto;
}

/* �J�����̗]�����Ȃ��� */
.app-columns {
	padding: 0!important;
}


/* �J�����𕝂����ς��ɕ\�� */
.column {
	width: ${document.body.clientWidth}px!important;
	height: ${document.body.clientHeight}px!important;
	max-width: 600px!important;
	margin: 0!important;
}

/* �J�����̐ݒ��absolute�� */
.js-column-options-container {
	position: absolute!important;
	width: 100%;
}

/* �T�C�h�p�l����\�������Ƃ��Ƀ��C���𓮂��Ȃ����� */
.application > .app-content {
	margin-right: 0!important;
	transform: translateX(0px)!important;
}

/* ���C���G���A�̃X�N���[�����֎~ */
#container {
	overflow: hidden!important;
}

/* �T�C�h�p�l���𕝂����ς��ɕ\�� */
.js-drawer {
	width: ${document.body.clientWidth}px!important;
	max-width: 600px!important;
	/*left: -${document.body.clientWidth}px!important;*/
	left: 0!important;
	transform: translateX(-${document.body.clientWidth}px);
}
.hide-detail-view-inline .js-drawer {/* �\���� */
	width: ${document.body.clientWidth}px!important;
	max-width: 600px!important;
	/*left: 0!important;*/
	transform: translateX(0);
	z-index: 201!important;
}
.hide-detail-view-inline .js-drawer:after {
	display: none!important;
}

/* �T�C�h�p�l���̃^�C�g�������� */
.js-docked-compose .compose-text-title {
	display: none!important;
}
/* �A�J�E���g�I���A�C�R���ʒu����ɂ��炷 */
.js-docked-compose .compose-accounts {
	width: 200px!important;
	margin-top: -50px;
}

/* �c�C�[�g���̓G���A������������������ */
.js-docked-compose .compose-text-container {
	padding: 5px!important;
}
.js-docked-compose .js-compose-text {
	height: 90px!important;
}

/* �c�C�[�g�{�^����傫�� */
.js-docked-compose .js-send-button {
	width: 100px!important;
	text-align: center;
}

/* �e��{�^�������������ĉ����тɂ��� */
.js-docked-compose .compose-content button.js-add-image-button,
.js-docked-compose .compose-content .js-schedule-button,
.js-docked-compose .compose-content .js-tweet-button,
.js-docked-compose .compose-content .js-dm-button {
	display: inline-block!important;
	width: auto!important;
}
.js-docked-compose .compose-content .js-tweet-button.is-hidden,
.js-docked-compose .compose-content .js-dm-button.is-hidden {
	display: none!important;
}
.js-add-image-button > .label,
.js-schedule-button > .label,
.js-tweet-button > .label,
.js-dm-button > .label {
	display: none!important;
}
.js-add-image-button,
.js-scheduler,
.js-tweet-type-button {
	display: inline-block;
	transform: translateY(-65px);
}


/* �T�C�h�p�l���̃t�b�^�[������ */
.js-docked-compose > footer {
	display: none!important;
}
.js-docked-compose .compose-content {
	bottom: 0!important;
}

/* �T�C�h�p�l���̃w�b�_�[������ */
.js-compose-header {
	position: absolute!important;
	right: 20px!important;
	border: 0!important;
}
header.js-compose-header div.compose-title {
	display: none!important;
}
.js-account-selector-grid-toggle {
	margin-right: 50px!important;
}

/* ���[�_���̈ʒu���� */
.overlay:before,
.ovl-plain:before,
.ovl:before {
	display: none!important;
}

/* ���c�C�[�g���[�_���̕��ݒ� */
#actions-modal > .mdl {
	max-width: 100%!important;
}

/* ���[�_���̃��f�B�A�\������ */
.js-modal-panel .js-embeditem {/* ��ʂ����ς��ɕ\�� */
	height: 100%!important;
	top: 0!important;
	bottom: 0!important;
}
.js-modal-panel .js-embeditem iframe {
	max-width: 100%!important;
	max-height: 100%!important;
}
.js-modal-panel .js-med-tweet {/* �c�C�[�g���\�� */
	display: none!important;
}

/* ����{�^�� */
.js-modal-panel .mdl-dismiss {
	z-index: 2;
}

/* �摜�\���𒲐����� */
.js-modal-panel .js-embeditem {
	display: flex!important;
	flex-direction: column;
	z-index: 1;
}
/* �摜�\������ */
.js-modal-panel .js-embeditem .l-table {
	position: relative!important;
	display: block!important;
	height: auto!important;
	flex: auto;
}

.js-modal-panel .js-embeditem .l-table div,
.js-modal-panel .js-embeditem .l-table a {
	position: static!important;
}
.js-modal-panel .js-embeditem .l-table .js-media-image-link {
	pointer-events: none;
}

/* �摜�T�C�Y�w�� */
.js-modal-panel .js-embeditem .l-table img,
.js-modal-panel .js-embeditem .l-table iframe {
	position: absolute;
	max-width: 100%!important;
	max-height: 100%!important;
	width: auto!important;
	height: auto!important;
	top: 0!important;
	bottom: 0!important;
	left: 0!important;
	right: 0!important;
	margin: auto!important;
}
.js-modal-panel .js-embeditem .l-table iframe {
	width: 100%!important;
	height: 100%!important;
}

/* �摜�����{�^���̈ʒu���� */
.js-modal-panel .js-embeditem .l-table .reverse-image-search {
	position: fixed!important;
	display: block!important;
	left: 10px!important;
}

/* �摜�ړ��{�^���̕\���ʒu�𒲐����� */
.js-modal-panel .js-embeditem .js-media-gallery-prev,
.js-modal-panel .js-embeditem .js-media-gallery-next {
	position: relative!important;
	top: auto!important;
	width: 50%!important;
	height: 60px!important;
}
.js-modal-panel .js-embeditem .js-media-gallery-next {
	margin-top: -60px;
	align-self: flex-end;
}

/* �摜�����̃����N���\�� */
.med-origlink,
.med-flaglink {
	display: none!important;
}


/* �f�o�b�O�p���U�C�N */
.tj_blur .js-stream-item-content {
	filter: blur(5px);
}
.tj_blur section.column:nth-child(1) .js-stream-item-content {
	filter: none;
}
`;
		$head.appendChild($style);
	}
}


window.tj_deck = null;
function tjDeckStart() {
	console.log("TJDeck�X�^�[�g�I�I�I");
	window.tj_deck = new TJDeck();
	window.tj_deck.manageStyle();
	window.tj_deck.manageScroll();
	window.tj_deck.manageBack();
	window.tj_deck.observeClms();
	window.tj_deck.observeModals();
	window.tj_deck.hideMenu();
	window.tj_deck.addTJNav();
	document.querySelector("textarea.js-compose-text").spellcheck = false;
}



if (document.querySelector(".js-app-columns")) {
	tjDeckStart();
} else {
	var timer = setInterval(function () {
		if (document.querySelector(".js-app-columns")) {
			tjDeckStart();
			clearInterval(timer);
		} else {
			console.log("�܂����[�h��");
		}
	}, 500);
}
