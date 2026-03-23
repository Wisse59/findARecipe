const { createApp } = Vue;

createApp({
    data() {
        return {
            rechercheTexte: '', //ce qui est tapé dans la barre
            recettes: [], //le tableau est vide puisqu'il se remplira automatiquement par l'API
            recetteSelectionnee: null, // vide au départ
            pageActuelle: 'menu', //pour savoir sur quelle "page" on est : 'menu' ou 'recherche'
            
            //variables pour la recherche avancée
            filtreTempsIndex: 15, //la jauge commence tout à droite (index 15)
            
            //notre tableau avec les paliers de temps précis
            tempsOptions: [
                { label: '10 min', value: 10 },
                { label: '15 min', value: 15 },
                { label: '20 min', value: 20 },
                { label: '25 min', value: 25 },
                { label: '30 min', value: 30 },
                { label: '35 min', value: 35 },
                { label: '40 min', value: 40 },
                { label: '45 min', value: 45 },
                { label: '50 min', value: 50 },
                { label: '55 min', value: 55 },
                { label: '1 h', value: 60 },
                { label: '1 h 30', value: 90 },
                { label: '2 h', value: 120 },
                { label: '3 h', value: 180 },
                { label: '4 h', value: 240 },
                { label: '5 h+', value: 9999 }
            ],

            filtrePays: '', //tous s'il est vide
            filtreIngredients: [], //tableau pour les cases à cocher multiples
            filtreUstensiles: [],
            
            //variables pour l'abonnement et les alertes
            notifications: 0, //le compteur de la cloche
            platsNotifies: [], //les plats qui correspondent à l'alerte
            alertes: [], //le tableau qui va stocker toutes les alertes créées
            nouvelleAlerte: { //le formulaire de création d'alerte
                pays: '',
                ingredients: [] //un tableau puisqu'on va cocher plusieurs cases
            },
            
            //des ingrédients courants pour les cases à cocher
            ingredientsPopulaires: ['Poulet', 'Bœuf', 'Pâtes', 'Riz', 'Tomate', 'Pomme de terre', 'Oignon', 'Ail', 'Fromage', 'Oeuf', 'Chocolat'],

            //une liste des ustensiles les plus pertinents pour filtrer
            ustensilesPopulaires: ['Poêle', 'Casserole', 'Four', 'Moule', 'Mixeur', 'Passoire', 'Wok', 'Couteau', 'Saladier', 'Marmite'],
            
            //nouvelles variables pour l'inscription et la connexion

            //les infos pour l'inscription
            userInscription: '', //l'user tapé dans le formulaire
            mailInscription: '', //l'email tapé dans le formulaire
            mdpInscription: '',//le mot de passe tapé dans le formulaire
            
            //les infos pour la connexion
            idConnexion: '', //que ce soit le mail ou l'user
            mdpConnexion: '',
            utilisateurConnecte: null, //l'email de l'utilisateur connecté (null si personne n'est connecté)
            token: null //le badge d'accès sécurisé envoyé par le serveur
        }
    },
    mounted() {
        //dès que la page charge, Vue appelle Node.js pour récupérer les recettes
        fetch('http://localhost:3000/api/recettes')
            .then(response => response.json()) //on transforme la réponse en JSON lisible
            .then(data => {
                this.recettes = data; //on stocke les recettes reçues dans notre variable locale
            })
            .catch(error => {
                console.error("Erreur lors de la récupération depuis l'API :", error);
            });

        //on vérifie si l'utilisateur s'était déjà connecté avant (grâce à la mémoire du navigateur)
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('username');
        
        //si on trouve un token et un utilisateur sauvegardés, on reconnecte l'utilisateur automatiquement
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.utilisateurConnecte = savedUser;
        }
    },
    computed: {
        recettesFiltrees() {
            //si la barre est vide, on retourne tout
            if (this.rechercheTexte === '') {
                return this.recettes;
            }
            
            //sinon on filtre, en minuscule pour éviter les problèmes de majuscules
            return this.recettes.filter(r => {
                return r.titre.toLowerCase().includes(this.rechercheTexte.toLowerCase());
            });
        },
        //création automatique des listes depuis la base de données
        paysDisponibles() {
            //on récupère tous les pays, split coupe ce qu'il y a après la parenthèse, comme dans "France (Bretagne)"
            const pays = this.recettes.map(r => r.details.provenance.split(' (')[0]);
            return [...new Set(pays)].filter(p => p).sort();
        },
        ustensilesDisponibles() {
            //on récupère tous les ustensiles de toutes les recettes pour créer les choix
            let ustensiles = [];
            this.recettes.forEach(r => {
                if (r.details && r.details.ustensiles) {
                    ustensiles.push(...r.details.ustensiles);
                }
            });
            //on enlève les doublons et on trie par ordre alphabétique
            return [...new Set(ustensiles)].sort();
        },

        //le nouveau système de filtrage
        recettesFiltreesAvancees() {
            return this.recettes.filter(r => {
                //on gère d'abord le calcul du temps en transformant "1h30" ou "45 min" en minutes
                let tempsStr = (r.details.tempsCuisine || '').toLowerCase();
                let tempsMin = 0;
                if (tempsStr.includes('h')) tempsMin += parseInt(tempsStr.match(/(\d+)\s*h/)?.[1] || 0) * 60;
                if (tempsStr.includes('m')) tempsMin += parseInt(tempsStr.match(/(\d+)\s*m/)?.[1] || 0);
                if (tempsMin === 0) tempsMin = parseInt(tempsStr.match(/(\d+)/)?.[1] || 0); //si y a pas d'unité écrite
                
                //on vérifie si le temps de la recette est en dessous de ce qu'on a mis dans la jauge
                const matchTemps = tempsMin <= this.tempsOptions[this.filtreTempsIndex].value;

                //on regarde si le pays de la recette Comment PAR le pays coché, pour que "France (Bretagne)" match avec "France" par exmpl
                const matchPays = this.filtrePays === '' || r.details.provenance.startsWith(this.filtrePays);

                //pour les ingrédients, on vérifie que la recette contient TOUTES les cases cochées
                const matchIngredients = this.filtreIngredients.every(ing => 
                    r.ingredients.toLowerCase().includes(ing.toLowerCase()) ||
                    r.details.ingredientsComplets.some(i => i.toLowerCase().includes(ing.toLowerCase()))
                );

                //pour les ustensiles, on utilise "includes" pour que "Moule" trouve "Moule à gâteau" par exemple
                const matchUstensiles = this.filtreUstensiles.every(ust => 
                    r.details.ustensiles.some(u => u.toLowerCase().includes(ust.toLowerCase()))
                );

                //la recette doit correspondre à TOUS les filtres
                return matchTemps && matchPays && matchIngredients && matchUstensiles;
            });
        },

        //on teste indivudellement si les conditions du mdp sont remplies
        tailleMdp() { return this.mdpInscription.length >= 10; },
        majusculeMdp() { return /[A-Z]/.test(this.mdpInscription); },
        minusculeMdp() { return /[a-z]/.test(this.mdpInscription); },
        numMdp() { return /[0-9]/.test(this.mdpInscription); },
        mdpSpecial() { return /[^A-Za-z0-9]/.test(this.mdpInscription); },
        

        //o vérification du format de l'email o
        testEmailValide() {
            //notre expression reguliere verifie qu'on ait : texte + @ + texte + . + texte, et ainsi que le mail soit correct
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(this.mailInscription);
        },
        
        testMdpValide() {
            return this.tailleMdp && this.majusculeMdp && this.minusculeMdp && this.numMdp && this.mdpSpecial && this.userInscription && this.testEmailValide;
        }
    },
    methods: {
        reinitialiserRecherche() {
            this.rechercheTexte = '';
        },
        changerPage(page) {
            this.pageActuelle = page;
            window.scrollTo(0, 0); //remonter tout en haut de la page
        },
        //la méthode de selection se lance au clic
        selectionnerRecette(recette) {
            this.recetteSelectionnee = recette;
        },

        //méthode de la cloche et du plat aléatoire
        ajouterPlatAleatoire() {
            if (this.recettes.length === 0) return;
            
            //on tire un plat au hasard
            const indexAleatoire = Math.floor(Math.random() * this.recettes.length);
            const platOriginal = this.recettes[indexAleatoire];
            
            const nouveauPlat = { ...platOriginal, id: Date.now() };
            
            //on l'ajoute visuellement à la page
            this.recettes.push(nouveauPlat);
            
            //on vérifie si le plat correspond à au moins une des alertes créées
            if (this.alertes.length > 0) {
                let declencheAlerte = false;

                for (let alerte of this.alertes) {
                    let match = true;
                    
                    //on vérifie le pays
                    if (alerte.pays && !nouveauPlat.details.provenance.toLowerCase().includes(alerte.pays.toLowerCase())) {
                        match = false;
                    }
                    
                    //on vérifie que le plat contient tous les ingrédients cochés dans cette alerte
                    if (alerte.ingredients.length > 0) {
                        const contientTousLesIngredients = alerte.ingredients.every(ing => 
                            nouveauPlat.ingredients.toLowerCase().includes(ing.toLowerCase()) ||
                            nouveauPlat.details.ingredientsComplets.some(i => i.toLowerCase().includes(ing.toLowerCase()))
                        );
                        if (!contientTousLesIngredients) match = false;
                    }
                    
                    //si cette alerte précise correspond au plat, c'est gagné, on arrête de chercher
                    if (match) {
                        declencheAlerte = true;
                        break;
                    }
                }
                
                //si ça a déclenché une alerte, on fait +1 sur la cloche
                //si ça a déclenché une alerte, on fait +1 sur la cloche
                if (declencheAlerte) {
                    this.notifications++;
                    this.platsNotifies.push(nouveauPlat);

                    //On demande au serveur d'envoyer l'e-mail !
                    fetch('http://localhost:3000/api/envoyerAlerte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username: this.utilisateurConnecte, //on envoie le nom du mec connecté
                            platTitre: nouveauPlat.titre  //et le nom du plat tiré au sort
                        })
                    })
                    .then(res => res.json())
                    .then(data => console.log("Statut e-mail :", data))
                    .catch(err => console.error("Erreur e-mail :", err));
                }
            }
        },

        //méthode pour enregistrer une nouvelle alerte
        ajouterAlerte() {
            //on vérifie que l'utilisateur a rempli au moins un truc
            if (this.nouvelleAlerte.pays === '' && this.nouvelleAlerte.ingredients.length === 0) {
                alert("Veuillez choisir au moins un pays ou un ingrédient !");
                return;
            }
            
            //on ajoute l'alerte à notre tableau
            this.alertes.push({
                id: Date.now(), //on lui donne un identifiant unique
                pays: this.nouvelleAlerte.pays,
                ingredients: [...this.nouvelleAlerte.ingredients]
            });
            
            //on vide le formulaire
            this.nouvelleAlerte.pays = '';
            this.nouvelleAlerte.ingredients = [];
        },

        //méthode pour enlever une alerte
        supprimerAlerte(id) {
            this.alertes = this.alertes.filter(alerte => alerte.id !== id);
        },
        
        //nouvelles méthodes pour gérer les comptes

        //methode pour changer la couleur du texte des regles mdp
        ruleClass(isValid) {
            if (this.mdpInscription.length === 0) return 'text-secondary'; //gris si vide
            return isValid ? 'text-success' : 'text-danger'; //vert si >=10 lettres, rouge si pas suffisant
        },
        //méthode pour créer un compte
        async register() {
            try {
                //on envoie l'email, le pseudo et le mot de passe à notre nouvelle route Node.js
                const response = await fetch('http://localhost:3000/api/inscription', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: this.userInscription, email: this.mailInscription, password: this.mdpInscription })
                });
                
                const data = await response.json(); //on lit la réponse du serveur
                
                if (response.ok) {
                    alert("Inscription réussie !");

                    //J'ai choisi une auto-connexion à l'inscription
                    this.idConnexion = this.userInscription;
                    this.mdpConnexion = this.mdpInscription;
                    
                    //on lance la méthode de connexion
                    await this.login();

                    //on vide les champs pour que ça soit propre
                    this.userInscription = '';
                    this.mailInscription = '';
                    this.mdpInscription = '';
                } else {
                    //si y a une erreur (ex: email déjà pris), on l'affiche
                    alert("Erreur : " + data.error);
                }
            } catch (e) { 
                console.error("Erreur de connexion au serveur :", e); 
            }
        },

        //méthode pour se connecter
        async login() {
            try {
                //on envoie l'email et le mot de passe pour vérifier s'ils sont bons
                const response = await fetch('http://localhost:3000/api/connexion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        identifier: this.idConnexion, //le mail ou le pseudo
                        password: this.mdpConnexion 
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    //si c'est bon, on enregistre l'utilisateur dans nos variables Vue.js
                    this.utilisateurConnecte = data.username;
                    this.token = data.token;
                    
                    //on sauvegarde aussi dans le navigateur pour ne pas le perdre si on actualise la page, avec F5
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    
                    alert("Bienvenue " + data.username + " !");
                    
                    //on vide les champs du formulaire proprement
                    this.idConnexion = '';
                    this.mdpConnexion = '';
                } else {
                    //si mauvais mot de passe ou email introuvable
                    alert("Erreur : " + data.error);
                }
            } catch (e) { 
                console.error("erreur de connexion au serveur :", e); 
            }
        },

        //méthode pour se déconnecter
        logout() {
            //on vide nos variables locales
            this.utilisateurConnecte = null;
            this.token = null;
            
            //on supprime les infos de la mémoire du navigateur
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            
            alert("Tu es bien déconnecté.");
        }
    }
}).mount('#app');