import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';

autocomplete( $('#address'), $('#lat'), $('#lng') );

typeAhead( $('.search'));

const heartForms = document.querySelectorAll('form.heart');
heartForms.forEach(heartForm => heartForm.addEventListener('submit', ajaxHeart));

