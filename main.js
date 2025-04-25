'use strict';

const sliderContainer = document.querySelector( '.slider__container' );
const sliderTrack = document.querySelector( '.slider__track' );
const slidesFromDom = document.querySelectorAll( '.slider__slide' );
const nextButton = document.querySelector( '.slider__btn--right' );
const prevButton = document.querySelector( '.slider__btn--left' );

// SLIDER
function slider ( options ) {
   const initOptions = {
      loop: false,
      speed: 1000,
      autoplay: false,
      margin: 30,
      numOfItems: 1,
      duration: 1000,
      ...options,
   };

   const { loop, margin, duration, autoplay, numOfItems, speed } = initOptions;
   const containerWidth = sliderContainer.getBoundingClientRect().width;

   let sliderItems = [];
   let slideIndex = 2;
   let numClonedItemsOffscreen = 0;
   let itemWidth = containerWidth / numOfItems;

   // initialize slider
   const initializeSlider = () => {
      const items = createWrapperForSlides();
      const allItemsIncludingClones = cloneSlidesWrapper( items );

      renderItemsToDOM( allItemsIncludingClones );

      if ( !loop ) updateNavigationButtonsState();

      if ( autoplay ) autoPlaySlides();
   };

   const updateNavigationButtonsState = () => {
      if ( loop ) return;

      const startIndex = sliderItems.length / 3;

      nextButton.disabled = slideIndex === startIndex + 1;
      prevButton.disabled = slideIndex === startIndex;
   };

   const updateTrackStyles = ({ offset, transition }) => {
      Object.assign( sliderTrack.style, {
         transform: `translate3d(${offset}px, 0px, 0px)`,
         transition,
      });
   };

   const goToSlide = ( index ) => {
      const activeItem = document.querySelectorAll( '.slider__item' )[index];
      const isClone = activeItem.classList.contains( 'slider__item--clone' );

      const defaultStyles = {
         offset: -slideIndex * itemWidth,
         transition: `${speed}ms`,
      };

      const originalItem = document.getElementById(
         `${activeItem.dataset.originalId}`
      );

      const handleSlide = ( startOffset, endOffset ) => {
         if ( !startOffset && !endOffset ) {
            updateTrackStyles( defaultStyles );

            return false;
         }

         const originalItemIndex = Number( originalItem.dataset.slide );

         updateTrackStyles({
            offset: startOffset,
            transition: 'none',
         });

         void sliderTrack.offsetWidth;

         requestAnimationFrame( () => {
            updateTrackStyles({
               offset: endOffset,
               transition: `${speed}ms`,
            });
         });

         slideIndex = originalItemIndex;

         return true;
      };

      if ( !loop || !isClone ) {
         return handleSlide();
      }

      const originalItemIndex = Number( originalItem.dataset.slide );
      const cloneIndex = Number( activeItem.dataset.slide );

      if ( cloneIndex === sliderItems.length - 2 ) {
         const itemBeforeOriginalOffset = -( originalItemIndex - 1 ) * itemWidth;
         const originalItemOffset = itemBeforeOriginalOffset + itemWidth * -1;

         return handleSlide( itemBeforeOriginalOffset, originalItemOffset );
      } else if ( cloneIndex === 0 ) {
         const itemAfterTheOriginalOffset =
            -( originalItemIndex + 1 ) * itemWidth;
         const originalItemOffset = itemAfterTheOriginalOffset + itemWidth * 1;

         return handleSlide( itemAfterTheOriginalOffset, originalItemOffset );
      }

      return handleSlide();
   };

   const slideQueue = [];
   let inTransition = false;

   const handlePrevAndNextSlide = ( slideTo ) => {
      if ( inTransition ) {
         if ( slideQueue.length < 3 ) slideQueue.push( slideTo );

         return;
      }

      inTransition = true;

      if ( slideTo === 'next' ) slideIndex++;
      else if ( slideTo === 'prev' ) slideIndex--;

      const transitionHandled = goToSlide( slideIndex );

      const endTransition = () => {
         inTransition = false;
         updateNavigationButtonsState();

         if ( slideQueue.length > 0 ) {
            const nextDirection = slideQueue.shift();

            handlePrevAndNextSlide( nextDirection );
         }
      };

      if ( !transitionHandled ) {
         // Still in Transition: wait for it to end
         const onTransitionEnd = () => {
            sliderTrack.removeEventListener( 'transitionend', onTransitionEnd );
            endTransition();
         };

         sliderTrack.addEventListener( 'transitionend', onTransitionEnd );
      } else {
         // Jumped instantly: no need to wait
         requestAnimationFrame( () => {
            endTransition();
         });
      }
   };

   // Create Item to wrap the slide for margin
   const createWrapperForSlides = function () {
      let items = [];

      slidesFromDom.forEach( ( s, i ) => {
         const el = document.createElement( 'div' );
         const width = ( itemWidth - margin * 2 ) * 0.1;

         el.id = `item-${i}`;
         el.className = 'slider__item';
         el.insertAdjacentElement( 'beforeend', s );

         Object.assign( el.style, {
            margin: margin + 'px',
            width: width + 'rem',
         });

         items.push( el );
      });

      return items;
   };

   const cloneSlidesWrapper = function ( items ) {
      const loopCount = items.length % 2 === 0 ? 1 : 2;
      const range = ( items.length * loopCount ) / 2;
      const clonedItems = [];

      for ( let x = 0; x < loopCount; x++ ) {
         items.forEach( ( el ) => {
            const clone = el.cloneNode( true );

            clone.removeAttribute( 'id' );
            clone.setAttribute( 'data-original-id', el.id );
            clone.classList.add( 'slider__item--clone', 'clone' );

            clonedItems.push( clone );
         });
      }

      items.push( ...clonedItems.slice( range ) );
      items.unshift( ...clonedItems.slice( 0, range ) );

      const itemsWithSlideIndex = items.map( ( item, i ) => {
         item.setAttribute( 'data-slide', i );

         return item;
      });

      numClonedItemsOffscreen = clonedItems.length;
      slideIndex = numClonedItemsOffscreen / 2;

      return itemsWithSlideIndex;
   };

   const renderItemsToDOM = function ( items ) {
      const offset = itemWidth * ( numClonedItemsOffscreen / 2 ) * -1;

      sliderTrack.innerHTML = '';

      updateTrackStyles({ transition: 'none', offset });

      items.forEach( ( item ) =>
         sliderTrack.insertAdjacentElement( 'beforeend', item )
      );

      sliderItems = document.querySelectorAll( '.slider__item' );
   };

   const autoPlaySlides = () => {
      setInterval( () => {
         if ( inTransition ) return;

         handlePrevAndNextSlide( 'next' );
      }, duration );
   };

   // Event handler
   nextButton.addEventListener(
      'click',
      handlePrevAndNextSlide.bind( null, 'next' )
   );
   prevButton.addEventListener(
      'click',
      handlePrevAndNextSlide.bind( null, 'prev' )
   );

   initializeSlider();
}

slider({
   autoplay: true,
   duration: 2000,
   loop: true,
   speed: 1500,
   margin: 10,
   numOfItems: 3,
});
