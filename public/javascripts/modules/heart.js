import axios from 'axios';

function ajaxHeart(e){
    e.preventDefault();
    axios.post(this.action)
    .then(res => {
        //we can access this.heart because it is a nested element on our form (reffered to by 'this')
        //with a name attribute of heart
        const isHearted = this.heart.classList.toggle('heart__button--hearted');
        const heartCount = document.querySelector('.heart-count');
        heartCount.innerText = res.data.hearts.length;
        if(isHearted){
            this.heart.classList.add('heart__button--float');
            setTimeout(() => {
                this.heart.classList.remove('heart__button--float');
            }, 2500);
        }
    })
    .catch(err => console.log(err));
}

export default ajaxHeart;