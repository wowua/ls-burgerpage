export default () => {

  const calculateWidth = () => {
    const wWidth = $(window).width()
    const titles = $('.menu-acco__trigger')
    const titleWidth = titles.width()
    const reqWidth = wWidth - (titleWidth * titles.length)

    return (reqWidth > 550) ? 550 : reqWidth
  }

  $('.menu-acco__trigger').on('click', (e) => {
    e.preventDefault();

    const $this = $(e.target)
    const container = $this.closest('.menu-acco')
    const item = $this.closest('.menu-acco__item')
    const items = container.find('.menu-acco__item')
    const activeItem = items.filter('.active')
    const content = item.find('.menu-acco__content')
    const activeContent = activeItem.find('.menu-acco__content')
    const accoText = container.find('.menu-acco__text')
    const reqWidth = calculateWidth()

    if (!item.hasClass('active')) {
      items.removeClass('active');
      item.addClass('active');

      accoText.hide();
      activeContent.animate({ 'width': '0px' });

      content.animate({
        'width': reqWidth + 'px'
      }, () => { accoText.fadeIn() })

    } else {
      item.removeClass('active');

      accoText.fadeOut(function () {
        content.animate({ 'width': '0px' });
      });
    }
  });

  // клик вне аккордеона
  $(document).on('click', (e) => {
    const $this = $(e.target);

    if (!$this.closest('.menu-acco').length) {
      $('.menu-acco__content').animate({
        'width': '0px'
      });

      $('.menu-acco__item').removeClass('active');
    }
  });
}
