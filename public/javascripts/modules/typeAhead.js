const axios = require('axios');

function typeAhead(search){
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.addEventListener('input', logInput);

    function logInput(e){
        if(!e.target.value){
            searchResults.style.display = 'none';
            return;
        }

        searchResults.style.display = 'block';
        searchResults.innerHTML = '';

        axios.get(`/api/search?q=${e.target.value}`)
        .then(res => {
            if(res.data.length){
               searchResults.innerHTML = searchResultsHTML(res.data);
            }
        })
        .catch(err => {
            console.log(err);
        });
    }

    //handle keyboard inputs
    searchInput.on('keyup', (e) => {
        
        if(![38, 40, 13].includes(e.keyCode)){
            return;
        }
        
        //TODO: if 38, 40, 13, cycle through results
            /*TODO: cycle through dropdown menu with up and down arrows, when you get to the 
            first item and press up, it should put focus on the final item, if you're on the 
            final item and press down, it should put focus on the first item, otherwise it should
            move up and down as expected

            Thoughts:
            -loop through each nodelist item, ie: searchResults.querySelectorAll('.search__result')
            -if there is no focus, set focus on first item (if down pressed, or last item if up pressed)
            -for any subsequent moves, just check if we are on the first or last list item, if we are
            move up or down as needed
            -otherwise, move up or down as needed in either direction
            */
            const searchResultItems = searchResults.querySelectorAll('.search__result')
            const focusedElement = checkForFocus(searchResultItems);
            console.log(focusedElement);

            if(e.keyCode === 13 && document.querySelector('.search__result.active')){
                document.querySelector('.search__result.active').click();
            }else if(typeof focusedElement === 'undefined' && e.keyCode !== 13){
                if(e.keyCode === 40){
                    searchResultItems[0].classList.add('active');
                }else{
                    searchResultItems[searchResultItems.length - 1].classList.add('active');
                }
            }else if(focusedElement >= 0){
                removeFocus(searchResultItems);
                if(e.keyCode === 38 && focusedElement === 0){
                    searchResultItems[searchResultItems.length - 1].classList.add('active');
                }else if(e.keyCode === 40 && focusedElement === searchResultItems.length - 1){
                    searchResultItems[0].classList.add('active');
                }else if(e.keyCode === 40){
                    searchResultItems[focusedElement + 1].classList.add('active');
                }else{
                    searchResultItems[focusedElement - 1].classList.add('active');
                }
            }
    });

    function checkForFocus(nodelist){
        let current;

        nodelist.forEach( (node, index) => {
            if(node.classList.contains('active')){
                current = index;
            }
        });

        return current;
    }

    function removeFocus(nodelist){
        nodelist.forEach(node => {
            if(node.classList.contains('active')){
                node.classList.remove('active');
            }
        });
    }
}

function searchResultsHTML(stores){
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}



export default typeAhead;

