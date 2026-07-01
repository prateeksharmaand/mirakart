(function ($) {
  "use strict";

  const CLOTYA_APP = {
    init() {
      this.dom();
      this.scroll();
      this.mobileMenu();
      this.departmentMenu();
      this.stickyHeader();
      this.searchHolder();
      this.categoriesHolder();
      this.gdprCookie();
      this.newsletterPopup();
      this.stickyProduct();
      this.minicartmobile();
    },
    dom() {
      this.overlay = document.querySelector( '.site-mask' );
    },
    scroll() {
      const container = document.querySelectorAll( '.site-scroll' );

      for( var i = 0; i < container.length; i++ ) {
        const ps = new PerfectScrollbar( container[i], {
          suppressScrollX: true,
          wheelPropagation: true
        });

        ps.update();
      }
    },
    mobileMenu() {
      const canvasMenu = document.querySelector( '.site-offcanvas' );

      if ( canvasMenu != null || this.overlay !== null ) {

        let tl = gsap.timeline( { paused: true, reversed: true } );
        tl.set( canvasMenu, {
          autoAlpha: 1
        }).to( canvasMenu, .5, {
          x:0,
          ease: 'power4.inOut'
        }).to( this.overlay, .5, {
          autoAlpha: 1,
          ease: 'power4.inOut'
        }, "-=.5");

        const button = document.querySelectorAll( '.toggle-menu' );
		const categoryButton = $( '.mobile-bottom-menu a.categories' );
        const close = document.querySelector( '.offcanvas-close' );
        const mask = document.querySelector( '.site-mask' );

        if ( button !== null ) {
          for ( var i = 0; i < button.length; i++ ) {
            const self = button[i];

            self.addEventListener( 'click', ( e ) => {
              e.preventDefault();
              tl.play();
			  
		      if(mask){
				  mask.addEventListener( 'click', (e) => {
				    e.preventDefault();
				    tl.reverse();
				  });
			  }
			  
            });

          }
        }
		
        if ( categoryButton !== null ) {
          for ( var i = 0; i < categoryButton.length; i++ ) {
            const self = categoryButton[i];

            self.addEventListener( 'click', ( e ) => {
              e.preventDefault();
              tl.play();
            });

		    if(mask){
				mask.addEventListener( 'click', (e) => {
				  e.preventDefault();
				  tl.reverse();
				});
			}

          }
        }

        close.addEventListener( 'click', (e) => {
          e.preventDefault();
          tl.reverse(1.5);
        });



        const hasChildren = document.querySelectorAll( '.site-offcanvas .menu-item-has-children' );

        const subMenu = ( e ) => {
          let subUl;
          if ( e.target.tagName === 'A' ) {
            e.preventDefault();
            subUl = e.target.nextElementSibling;
          } else {
            subUl = e.target.previousElementSibling;
          }
          let parentUl = e.target.closest( 'ul' );
          let parentLi = e.target.closest( 'li' );
          let activeLi = parentUl.querySelectorAll( '.menu-item-has-children.active' );

          const closeSubs = () => {
            for ( var i = 0; i < activeLi.length; i++ ) {
              const activeSub = activeLi[i].children[1];
              const childSubs = activeSub.querySelectorAll( '.sub-menu' );
              for ( var i = 0; i < childSubs.length; i++ ) {
                if ( childSubs[i] != null ) {
                  gsap.set( childSubs[i], { height: 0 } );
                }
              }
            }
          }

          const subAnimation = ( element, event ) => {
            gsap.to( element, { duration: .4, height: event, ease: 'power4.inOut', onComplete: closeSubs } );
          }

          if ( ! parentLi.classList.contains( 'active' ) ) {
            for ( var i = 0; i < activeLi.length; i++ ) {
              activeLi[i].classList.remove( 'active' );
              const sub = activeLi[i].children[1];
              subAnimation( sub, 0 );
            }
            parentLi.classList.add( 'active' );
            subAnimation( subUl, 'auto' );
          } else {
            parentLi.classList.remove( 'active' );
            subAnimation( subUl, 0 );
          }

        }

        for( var i = 0; i < hasChildren.length; i++ ) {
          const dropdown = document.createElement( 'span' );
          dropdown.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>';
          dropdown.className = 'menu-dropdown';
          hasChildren[i].appendChild( dropdown );

          const link = hasChildren[i].querySelector( 'a[href*="#"]' );
          const sub = hasChildren[i].children[1];
          gsap.set( sub, { height: 0 } );
          dropdown.addEventListener( 'click', subMenu );
		  if(link){
			link.addEventListener( 'click', subMenu );
		  }
        }
      }
    },
    departmentMenu(){
      const container = document.querySelectorAll( '.site-departments' );

      if (container !== null) {
        container.forEach( ( el ) => {
          const menu = el.querySelector( '.departments-menu .menu' );
          if ( menu !== null ) {
            const hasChildMenu = menu.querySelectorAll( '.menu-item-has-children' );
            for ( var i = 0; i < hasChildMenu.length; i++ ) {
              const hasItem = hasChildMenu[i];
              const subMenu = hasItem.lastElementChild;

              if ( subMenu.classList.contains( 'sub-menu' ) ) {
                const subParent = subMenu.parentNode;
                if ( subParent.classList.contains( 'has-image' ) ) {
                  const menuWidth = subMenu.offsetWidth;

                  subMenu.style.width = menuWidth + ( menuWidth / 1.5 ) + 'px';
                }
              }
            }
          }
        });
      }
    },
    stickyHeader() {
      const header = document.querySelector('.site-header');

      if (header !== null && header.classList.contains('header-sticky-enable')) {
        window.onscroll = function() {stickyHeader()};

        const headerHeight = header.offsetHeight + 100;
        var sticky = header.offsetTop + headerHeight;

        const stickyHeader = () => {
          if ( window.pageYOffset > sticky ) {
            header.classList.add('sticky-active');
            document.body.classList.add('header-sticky-active');
          } else {
            header.classList.remove('sticky-active');
            document.body.classList.remove('header-sticky-active');
          }
        }
      }
    },
    searchHolder() {
      const header = document.querySelector('.site-header');
      const button = document.querySelectorAll('.search-button');
      const search = document.querySelector('.search-holder');
      const close = document.querySelector('.search-holder-close');

      if (search != null) {
        let forward = true;
        const searchInner = search.querySelector('.search-holder-inner');
        const headerHeight = () => {
          searchInner.style.paddingTop = header.offsetHeight + 'px';
        }

        window.addEventListener('load', headerHeight);
        window.addEventListener('resize', headerHeight);

        if ( forward ) {
          if ( button !== null ) {
            for ( var i = 0; i < button.length; i++ ) {
              button[i].addEventListener( 'click', ( e ) => {
                e.preventDefault();
                document.body.classList.toggle('search-active');
                forward = false;
              }, false);
            }
          }
        }

        close.addEventListener( 'click', ( e ) => {
          e.preventDefault();
          if ( !forward ) {
            if (document.body.classList.contains('search-active')) {
              document.body.classList.remove('search-active');
            }
          }
          forward = true;
        }, false );
      }
    },
    categoriesHolder() {
      const button = document.querySelectorAll('.categories-button');
      const container = document.querySelector('.categories-holder');
      let forward = true;

      if (container != null) {

        if ( forward ) {
          if ( button !== null ) {
            for ( var i = 0; i < button.length; i++ ) {
              button[i].addEventListener( 'click', ( e ) => {
                e.preventDefault();
                document.body.classList.toggle('categories-active');
                forward = false;
              }, false);
            }
          }
        }
      }
    },

    gdprCookie() {
      const body = $( 'body' );
      var popup = $( '.gdpr-content' );
	  if ( popup.length > 0 ) {
		  var popupClose = $( '.gdpr-content .btn' );
		  var expiresDate = popup.data( 'expires' );

		  const tl = gsap.timeline( { paused: true, reversed: true } );
		  tl.to( popup, { duration: .6, opacity: 1, visibility: 'visible', y: 0, ease: 'power4.inOut' } );

		  if ( body.hasClass( 'cookie-popup-enable' ) && !( Cookies.get( 'cookie-popup-visible' ) ) ) {
			window.addEventListener('DOMContentLoaded', (event) => {
			  tl.play();
			  popup.addClass( 'active' );
			});
		  }

		  popupClose.on( 'click', function(e) {
			e.preventDefault();
			Cookies.set( 'cookie-popup-visible', 'disable', { expires: expiresDate, path: '/' });
			tl.reverse();
			popup.removeClass( 'active' );
		  });
	  }
    },
    newsletterPopup() {
      const body = $( 'body' );
      var popup = $( '.newsletter-popup' );
	  if ( popup.length > 0 ) {
		  var popupClose = $( '.newsletter-popup .btn, .newsletter-popup .newsletter-close' );
		  var expiresDate = popup.data( 'expires' );

		  const tl = gsap.timeline( { paused: true, reversed: true } );
		  tl.to( popup, { duration: .6, opacity: 1, visibility: 'visible', y: 0, ease: 'power4.inOut' } );

		  if ( body.hasClass( 'newsletter-popup-enable' ) && !( Cookies.get( 'newsletter-popup-visible' ) ) ) {
			window.addEventListener('scroll', function() { 
			  let scrollpos = window.scrollY;

			  if (scrollpos >= 50) {
				tl.play();
				popup.addClass( 'active' );
			  }
			});
		  }

		  popupClose.on( 'click', function(e) {
			e.preventDefault();
			Cookies.set( 'newsletter-popup-visible', 'disable', { expires: expiresDate, path: '/' });
			tl.reverse();
			popup.removeClass( 'active' );
		  });
	  }
    },
    stickyProduct() {
      const container = document.querySelector('.single-product-sticky');

      if (container !== null) {
        document.body.classList.add('single-product-sticky-enable');
        window.onscroll = function() {stickyCart()};
        const single = document.querySelector('.single-product');
        let stickyProduct = single.offsetTop;

        const stickyCart = () => {
          if ( window.pageYOffset > stickyProduct ) {
            container.classList.add('sticky-active');
          } else {
            container.classList.remove('sticky-active');
          }
        }
      } else {
        document.body.classList.remove('single-product-sticky-enable');
      }
    },

    minicartmobile: function() {
	  if($(window).width() < 601){
		  var button = $( '.site-header .header-button > a.cart-button' );

		  button.on( 'click', function(e) {
			e.preventDefault();
			if($( '.site-header .header-button .cart-dropdown' ).hasClass('hide')){
				$( '.site-header .header-button .cart-dropdown' ).removeClass( 'hide' );
			} else {
				$( '.site-header .header-button .cart-dropdown' ).addClass( 'hide' );
			}
		  });
	  }
    },

  };

  CLOTYA_APP.init();
  
	$(document).ready(function() {
		$('.site-departments a.dropdown-toggle').on('click', function (e) {
			e.preventDefault();
			$(".departments-menu").collapse('toggle');
		});
	});
	
	$(window).on('load', function(){
		$('.site-loading').fadeOut('slow',function(){$(this).remove();});
	});
	
    $(window).scroll(function() {
        $(this).scrollTop() > 135 ? $("header.site-header").addClass("sticky-header") : $("header.site-header").removeClass("sticky-header")
    });

}(jQuery));