const { createApp } = Vue;

createApp({
    data() {
        return {
            searchQuery: '', //ce qui est tapé dans la barre
            recettes: [], //le tableau est vide puisqu'il se remplira automatiquement par l'API
            recetteSelectionnee: null //vide au départ
        }
    },
    mounted() {
        //dès que la page charge, Vue appelle Node.js
        fetch('http://localhost:3000/api/recettes')
            .then(response => response.json()) //on transforme la réponse en JSON lisible
            .then(data => {
                this.recettes = data; //on stocke les recettes reçues dans notre variable locale
            })
            .catch(error => {
                console.error("Erreur lors de la récupération depuis l'API :", error);
            });
    },
    computed: {
        recettesFiltrees() {
            //si la barre est vide, on retourne tout
            if (this.searchQuery === '') {
                return this.recettes;
            }
            
            //sinon on filtre, en minuscule pour éviter les problèmes de majuscules
            return this.recettes.filter(r => {
                return r.titre.toLowerCase().includes(this.searchQuery.toLowerCase());
            });
        }
    },
    methods: {
        resetSearch() {
            this.searchQuery = '';
        },
        //l méthode de selection se lance au clic
        selectionnerRecette(recette) {
            this.recetteSelectionnee = recette;
        }
    }
}).mount('#app');