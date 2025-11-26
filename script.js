
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = scrollPercent + '%';
    

    const header = document.querySelector('.header');
    if (header) {
        if (scrollTop > 100) {
            header.classList.add('shrink');
        } else {
            header.classList.remove('shrink');
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const progressFills = document.querySelectorAll('.progress-fill');
    
    const animateProgress = () => {
        progressFills.forEach(fill => {
            const rect = fill.getBoundingClientRect();
            const target = parseInt(fill.getAttribute('data-target'));
            
            
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const percentage = fill.parentElement.nextElementSibling;
                let currentWidth = parseInt(fill.style.width) || 0;
                
                
                if (currentWidth < target) {
                    let step = 0;
                    const interval = setInterval(() => {
                        step++;
                        currentWidth = Math.min(currentWidth + step, target);
                        fill.style.width = currentWidth + '%';
                        percentage.textContent = Math.round(currentWidth) + '%';
                        
                        if (currentWidth >= target) {
                            clearInterval(interval);
                        }
                    }, 10);
                }
            }
        });
    };
    
    window.addEventListener('scroll', animateProgress);
    animateProgress(); 
});


(function(){
    const buttons = document.querySelectorAll('.demo-open');
    const modal = document.getElementById('demo-modal');
    const frame = document.getElementById('demo-frame');
    const close = document.getElementById('demo-close');

    function open(url){
        if(!modal || !frame) return;
        frame.src = url;
        modal.setAttribute('aria-hidden','false');
    }
    function closeModal(){
        if(!modal || !frame) return;
        
        try { frame.src = 'about:blank'; } catch(e) { frame.src = ''; }
        modal.setAttribute('aria-hidden','true');
    }

    buttons.forEach(b=> b.addEventListener('click', (e)=>{
        const url = b.dataset.demoUrl || b.getAttribute('data-demo-url');
        if(url) open(url);
    }));

    if(close) close.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
    
    if(modal) modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
    
    
    window.addEventListener('message', (ev) => {
        if (!ev.data) return;
        if (ev.data.type === 'close-demo') closeModal();
    });
})();

