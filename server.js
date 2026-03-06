const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

//on autorise notre frontend (Vue.js) à venir chercher les données
app.use(cors());

//voici notre base de données de recettes
const recettes = [
    {
        id: 1,
        titre: "Lasagnes à la bolognaise",
        ingredients: "Pâtes à lasagne, bœuf, sauce tomate, béchamel, fromage",
        image: "assets/images/plat1.jpg",
        details: {
            provenance: "Italie",
            ustensiles: ["Plat à gratin", "Poêle", "Casserole"],
            ingredientsComplets: ["500g de bœuf haché", "Feuilles de lasagne", "800g de sauce tomate", "Béchamel", "Gruyère râpé"],
            preparation: "Faites revenir la viande, ajoutez la sauce tomate. Dans un plat, alternez pâtes, sauce bolognaise et béchamel. Parsemez de fromage et enfournez 45 min à 180°C."
        }
    },
    {
        id: 2,
        titre: "Lasagnes végétariennes",
        ingredients: "Pâtes à lasagne, courgettes, aubergines, sauce tomate, béchamel",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Italie (adaptation)",
            ustensiles: ["Plat à gratin", "Poêle"],
            ingredientsComplets: ["2 courgettes", "1 aubergine", "Feuilles de lasagne", "Sauce tomate", "Béchamel", "Mozzarella"],
            preparation: "Coupez et poêlez les légumes. Montez les lasagnes en alternant légumes, sauce et pâtes. Enfournez 40 min à 180°C."
        }
    },
    {
        id: 3,
        titre: "Spaghettis au fromage et jambon",
        ingredients: "Spaghettis, jambon blanc, crème fraîche, gruyère",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "France",
            ustensiles: ["Casserole", "Passoire"],
            ingredientsComplets: ["400g de spaghettis", "4 tranches de jambon", "20cl de crème fraîche", "100g de gruyère"],
            preparation: "Cuisez les pâtes. Coupez le jambon en morceaux. Mélangez les pâtes chaudes avec la crème, le jambon et le gruyère."
        }
    },
    {
        id: 4,
        titre: "Spaghettis à la carbonara",
        ingredients: "Spaghettis, guanciale, pecorino, œufs, poivre",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Italie (Rome)",
            ustensiles: ["Casserole", "Poêle", "Saladier"],
            ingredientsComplets: ["400g de spaghettis", "150g de guanciale (ou lardons)", "3 jaunes d'œufs", "100g de pecorino", "Poivre noir"],
            preparation: "Faites dorer le guanciale. Battez les jaunes avec le fromage. Mélangez le tout hors du feu avec les pâtes et un peu d'eau de cuisson."
        }
    },
    {
        id: 5,
        titre: "Spaghettis au saumon fumé",
        ingredients: "Spaghettis, saumon fumé, crème, aneth, citron",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Internationale",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de spaghettis", "200g de saumon fumé", "25cl de crème liquide", "Aneth", "1/2 citron"],
            preparation: "Cuisez les pâtes. Faites chauffer la crème avec l'aneth et le citron. Ajoutez le saumon coupé en lanières puis les pâtes."
        }
    },
    {
        id: 6,
        titre: "Pâtes à la sauce tomate",
        ingredients: "Pâtes, coulis de tomate, oignon, ail, basilic",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Italie",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de pâtes", "500ml de coulis de tomate", "1 oignon", "1 gousse d'ail", "Basilic frais"],
            preparation: "Faites revenir l'oignon et l'ail, ajoutez le coulis et laissez mijoter 15 min. Servez sur les pâtes cuites."
        }
    },
    {
        id: 7,
        titre: "Pâtes à la bolognaise",
        ingredients: "Pâtes, bœuf haché, sauce tomate, oignon, carotte",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Italie (Bologne)",
            ustensiles: ["Casserole", "Faitout"],
            ingredientsComplets: ["400g de pâtes", "300g de bœuf haché", "1 carotte", "1 oignon", "Sauce tomate"],
            preparation: "Faites revenir oignon, carotte et viande. Ajoutez la sauce tomate et mijotez. Servez sur les pâtes."
        }
    },
    {
        id: 8,
        titre: "Riz cantonais",
        ingredients: "Riz, petits pois, jambon, œufs, oignon",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Chine",
            ustensiles: ["Wok ou grande poêle", "Casserole"],
            ingredientsComplets: ["300g de riz cuit", "100g de petits pois", "2 tranches de jambon", "2 œufs", "Sauce soja"],
            preparation: "Faites des œufs brouillés. Sautez tous les ingrédients dans le wok avec le riz et la sauce soja."
        }
    },
    {
        id: 9,
        titre: "Riz sauté au curry",
        ingredients: "Riz, poulet, poudre de curry, légumes croquants",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Asie",
            ustensiles: ["Wok"],
            ingredientsComplets: ["300g de riz cuit", "2 filets de poulet", "2 càs de curry", "1 poivron", "1 oignon"],
            preparation: "Sautez le poulet en dés avec le poivron. Ajoutez le riz, saupoudrez de curry et mélangez bien à feu vif."
        }
    },
    {
        id: 10,
        titre: "Soupe de légumes",
        ingredients: "Pommes de terre, carottes, poireaux, navets, bouillon",
        image: "assets/images/templateImageRecette.png",
        details: {
            provenance: "Monde entier",
            ustensiles: ["Cocotte", "Mixeur plongeant"],
            ingredientsComplets: ["3 pommes de terre", "3 carottes", "2 blancs de poireaux", "1 navet", "1 bouillon cube"],
            preparation: "Coupez les légumes, couvrez d'eau avec le bouillon. Cuisez 30 min puis mixez le tout."
        }
    }
];

//on crée la route pour renvoyer le tableau JSON quand on va sur /api/recettes
app.get('/api/recettes', (req, res) => {
    res.json(recettes);
});

//pour démarrer le serveur
app.listen(port, () => {
    console.log(`✅ API démarrée et accessible sur http://localhost:${port}/api/recettes`);
});