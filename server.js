const express = require('express');
const cors = require('cors');
// on importe les nouveaux outils pour la base de données et la sécurité
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); //pour l'envoi de mail

const app = express();
const port = 3000;

//clé secrète pour générer les badges de connexion (tokens)
const SECRET_KEY = "wissem_secret_key_super_securisee"; 

//on autorise notre frontend (Vue.js) à venir chercher les données
app.use(cors());
// on permet au serveur de lire les données envoyées par les formulaires (en JSON)
app.use(express.json()); 

//o on initialise la Base de Données SQLite o
//on crée le fichier database.sqlite s'il n'existe pas
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error("Erreur d'ouverture de la DB :", err);
    } else {
        console.log("✅ Base de données SQLite connectée.");
        // on crée la table des utilisateurs si c'est la première fois
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        )`);
    }
});

//voici notre base de données de recettes
const recettes = [
    {
        id: 1,
        titre: "Lasagnes à la bolognaise",
        ingredients: "Pâtes à lasagne, bœuf, sauce tomate, béchamel, fromage",
        image: "assets/images/plat1.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "1 heure",
            ustensiles: ["Plat à gratin", "Poêle", "Casserole"],
            ingredientsComplets: ["500g de bœuf haché", "Des feuilles de lasagne", "800g de sauce tomate", "De la sauce béchamel", "Du gruyère râpé"],
            preparation: "Faites dorer la viande de bœuf hâché dans une poêle chaude pendant 5 à 8 minutes.\nVersez de la sauce tomate et laissez mijoter doucement 10 minutes, en baissant la puissance des plaques.\nDans un plat, alternez les pâtes, la viande recouverte de sauce tomate, et la sauce béchamel.\nParsemez du fromage et mettez le tout au four 45 minutes à 180°C.\nEnfin, vous pourrez récupérer vos lasagnes et les servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 2,
        titre: "Lasagnes au saumon et aux épinards",
        ingredients: "Pâtes à lasagne, saumon, épinards, crème fraîche, fromage",
        image: "assets/images/plat2.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "55 minutes",
            ustensiles: ["Plat à gratin", "Poêle"],
            ingredientsComplets: ["500g de saumon frais ou fumé", "Des feuilles de lasagne", "500g d'épinards frais", "50cl de crème fraîche épaisse", "Du gruyère râpé"],
            preparation: "Faites cuire les épinards dans une poêle chaude pendant quelques minutes pour qu'ils fondent et rapetissent.\nDans un plat, alternez les pâtes, les épinards, le saumon coupé en petits morceaux et la crème fraîche.\nParsemez de fromage et mettez le tout au four 40 minutes à 180°C.\nEnfin, vous pourrez récupérer vos lasagnes bien gratinées et les servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 3,
        titre: "Lasagnes végétariennes",
        ingredients: "Pâtes à lasagne, courgettes, aubergines, sauce tomate, béchamel",
        image: "assets/images/plat3.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "1 heure",
            ustensiles: ["Plat à gratin", "Poêle"],
            ingredientsComplets: ["2 courgettes", "1 aubergine", "Des feuilles de lasagne", "800g de sauce tomate", "De la sauce béchamel", "De la mozzarella"],
            preparation: "Coupez les légumes en petits carrés et faites-les cuire dans une poêle chaude pendant 10 minutes pour les rendre bien mous.\nDans un plat, alternez les pâtes, les légumes bien mélangés avec la sauce tomate, et la sauce béchamel.\nAjoutez la mozzarella par-dessus et mettez le tout au four 40 minutes à 180°C.\nEnfin, vous pourrez sortir le plat, le laisser refroidir un peu, et servir de belles parts dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 4,
        titre: "Spaghettis au fromage et jambon",
        ingredients: "Spaghettis, jambon blanc, crème fraîche, gruyère",
        image: "assets/images/plat4.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "20 minutes",
            ustensiles: ["Casserole", "Passoire"],
            ingredientsComplets: ["400g de spaghettis", "4 tranches de jambon", "20cl de crème fraîche", "100g de gruyère râpé"],
            preparation: "Faites cuire vos pâtes dans une grande casserole remplie d'eau bouillante.\nPendant ce temps, découpez vos tranches de jambon en petits carrés.\nEnlevez l'eau des pâtes, remettez-les dans la casserole, puis mélangez-les avec la crème, le jambon et le gruyère en baissant la puissance des plaques au minimum.\nEnfin, vous pourrez servir vos pâtes bien chaudes dans des assiettes creuses.\nEt régalez-vous !"
        }
    },
    {
        id: 5,
        titre: "Spaghettis à la carbonara",
        ingredients: "Spaghettis, guanciale, pecorino, œufs, poivre",
        image: "assets/images/plat5.jpg",
        details: {
            provenance: "Italie (Rome)",
            tempsCuisine: "25 minutes",
            ustensiles: ["Casserole", "Poêle", "Saladier"],
            ingredientsComplets: ["400g de spaghettis", "150g de guanciale (ou de bons lardons)", "3 jaunes d'œufs", "100g de pecorino râpé", "Poivre noir"],
            preparation: "Faites dorer la viande dans une poêle bien chaude, sans ajouter d'huile ou de beurre.\nDans un saladier, mélangez les jaunes d'œufs avec le fromage et un peu de poivre.\nFaites cuire vos pâtes dans l'eau bouillante, enlevez l'eau, et mélangez tout ensemble en dehors des plaques de cuisson pour ne pas cuire les œufs.\nEnfin, vous pourrez servir vos pâtes dans des assiettes avec un peu de fromage par-dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 6,
        titre: "Spaghettis au saumon fumé",
        ingredients: "Spaghettis, saumon fumé, crème, aneth, citron",
        image: "assets/images/plat6.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "20 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de spaghettis", "200g de saumon fumé", "25cl de crème liquide", "Un peu d'aneth", "Le jus d'un demi citron"],
            preparation: "Faites cuire vos pâtes dans une grande casserole remplie d'eau bouillante.\nFaites chauffer la crème liquide dans une poêle en baissant la puissance des plaques, et ajoutez l'aneth et le jus de citron.\nCoupez le saumon fumé en fines lanières et ajoutez-le à la crème juste avant d'y plonger vos spaghettis sans leur eau.\nEnfin, mélangez bien et servez vos pâtes dans de belles assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 7,
        titre: "Pâtes à la sauce tomate",
        ingredients: "Pâtes, coulis de tomate, oignon, ail, basilic",
        image: "assets/images/plat7.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "25 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de pâtes au choix", "500ml de coulis de tomate", "1 bel oignon", "1 gousse d'ail", "Quelques feuilles de basilic frais"],
            preparation: "Faites dorer l'oignon coupé en petits morceaux et l'ail écrasé dans une poêle chaude avec un peu d'huile d'olive.\nVersez le coulis de tomate et laissez mijoter doucement 15 minutes, en baissant la puissance des plaques.\nFaites cuire vos pâtes dans l'eau bouillante, enlevez l'eau, puis recouvrez-les de votre sauce tomate maison.\nEnfin, ajoutez quelques feuilles de basilic frais et servez dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 8,
        titre: "Pâtes à la bolognaise",
        ingredients: "Pâtes, bœuf haché, sauce tomate, oignon, carotte",
        image: "assets/images/plat8.jpg",
        details: {
            provenance: "Italie (Bologne)",
            tempsCuisine: "45 minutes",
            ustensiles: ["Casserole", "Faitout"],
            ingredientsComplets: ["400g de pâtes (tagliatelles ou macaronis)", "300g de bœuf haché", "1 carotte", "1 oignon", "De la sauce tomate"],
            preparation: "Faites cuire l'oignon, la carotte coupée en tout petits dés et la viande hachée dans une grande marmite bien chaude.\nUne fois la viande bien dorée, versez la sauce tomate et laissez mijoter doucement pendant 30 minutes, en baissant la puissance des plaques.\nFaites cuire vos pâtes dans l'eau bouillante, puis enlevez l'eau.\nEnfin, vous pourrez servir vos pâtes bien chaudes recouvertes de votre sauce bolognaise dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 9,
        titre: "Pâtes au saumon fumé",
        ingredients: "Pâtes courtes, saumon fumé, crème, ciboulette",
        image: "assets/images/plat9.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "20 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de pâtes courtes (comme des Penne)", "200g de saumon fumé", "25cl de crème fraîche", "De la ciboulette fraîche"],
            preparation: "Faites cuire les pâtes de votre choix dans une casserole d'eau bouillante.\nDans une poêle, faites chauffer doucement la crème avec un peu de poivre et de la ciboulette coupée finement, en baissant la puissance des plaques.\nAjoutez les morceaux de saumon fumé à la toute fin pour ne pas trop les cuire.\nEnfin, mélangez vos pâtes chaudes sans leur eau directement dans la poêle et servez-les dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 10,
        titre: "Riz cantonais",
        ingredients: "Riz, petits pois, jambon, œufs, oignon",
        image: "assets/images/plat10.jpg",
        details: {
            provenance: "Chine",
            tempsCuisine: "25 minutes",
            ustensiles: ["Wok ou grande poêle", "Casserole"],
            ingredientsComplets: ["300g de riz déjà cuit et refroidi", "100g de petits pois", "2 tranches de jambon", "2 œufs", "Un peu de sauce soja"],
            preparation: "Mélangez les œufs et faites-les cuire dans une grande poêle chaude pour faire des œufs brouillés, puis mettez-les de côté.\nFaites chauffer le riz déjà cuit dans la poêle avec un peu d'huile, puis ajoutez les petits pois, le jambon en petits carrés et les œufs brouillés.\nVersez un peu de sauce soja et mélangez bien le tout à pleine puissance pendant quelques minutes.\nEnfin, vous pourrez récupérer votre riz bien chaud et le servir dans de grands bols.\nEt régalez-vous !"
        }
    },
    {
        id: 11,
        titre: "Riz sauté au curry",
        ingredients: "Riz, poulet, poudre de curry, légumes croquants",
        image: "assets/images/plat11.jpg",
        details: {
            provenance: "Asie",
            tempsCuisine: "30 minutes",
            ustensiles: ["Wok ou grande poêle"],
            ingredientsComplets: ["300g de riz cuit", "2 filets de poulet", "2 cuillères à soupe de curry", "1 poivron", "1 oignon"],
            preparation: "Coupez le poulet en morceaux et faites-le dorer dans une grande poêle chaude avec l'oignon et le poivron coupés en dés.\nUne fois le poulet bien cuit, ajoutez le riz déjà cuit et saupoudrez d'une bonne dose de poudre de curry.\nMélangez très fort en gardant la puissance des plaques au maximum pour que le riz prenne bien le goût.\nEnfin, vous pourrez servir votre riz parfumé directement dans de belles assiettes creuses.\nEt régalez-vous !"
        }
    },
    {
        id: 12,
        titre: "Soupe de légumes",
        ingredients: "Pommes de terre, carottes, poireaux, navets, bouillon",
        image: "assets/images/plat12.jpg",
        details: {
            provenance: "Monde entier",
            tempsCuisine: "40 minutes",
            ustensiles: ["Cocotte ou Faitout", "Mixeur plongeant"],
            ingredientsComplets: ["3 pommes de terre", "3 carottes", "2 blancs de poireaux", "1 navet", "1 bouillon cube (volaille ou légumes)"],
            preparation: "Épluchez et coupez tous vos légumes en gros morceaux.\nMettez-les dans une grande marmite, recouvrez-les d'eau et ajoutez votre bouillon cube pour donner du goût.\nLaissez cuire doucement pendant 30 minutes, en baissant un peu la puissance des plaques, jusqu'à ce que les légumes soient très mous.\nMixez le tout pour obtenir une soupe bien liquide et sans morceaux.\nEnfin, vous pourrez servir la soupe bien chaude dans de grands bols.\nEt régalez-vous !"
        }
    },
    {
        id: 13,
        titre: "Penne à la crème",
        ingredients: "Penne, crème fraîche, fromage râpé, poivre",
        image: "assets/images/plat13.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "15 minutes",
            ustensiles: ["Casserole"],
            ingredientsComplets: ["400g de penne", "20cl de crème fraîche épaisse", "100g de fromage râpé", "Un peu de poivre"],
            preparation: "Faites cuire vos pâtes dans une grande casserole remplie d'eau bouillante.\nUne fois cuites, enlevez l'eau et remettez les pâtes dans la casserole.\nAjoutez la crème et le fromage, et mélangez doucement en baissant la puissance des plaques.\nEnfin, vous pourrez servir vos pâtes bien crémeuses dans des assiettes creuses.\nEt régalez-vous !"
        }
    },
    {
        id: 14,
        titre: "Tagliatelles au poulet",
        ingredients: "Tagliatelles, poulet, crème, champignons",
        image: "assets/images/plat14.jpg",
        details: {
            provenance: "France",
            tempsCuisine: "25 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de tagliatelles", "2 blancs de poulet", "20cl de crème liquide", "150g de champignons"],
            preparation: "Faites dorer le poulet coupé en morceaux et les champignons dans une poêle bien chaude.\nVersez la crème et laissez chauffer doucement, en baissant la puissance des plaques.\nFaites cuire vos pâtes dans l'eau bouillante, enlevez l'eau, puis mélangez-les avec la sauce dans la poêle.\nEnfin, vous pourrez servir ce beau plat dans de grandes assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 15,
        titre: "Gratin de pâtes",
        ingredients: "Pâtes, jambon, crème, gruyère râpé",
        image: "assets/images/plat15.jpg",
        details: {
            provenance: "France",
            tempsCuisine: "35 minutes",
            ustensiles: ["Casserole", "Plat à gratin"],
            ingredientsComplets: ["400g de pâtes", "4 tranches de jambon", "20cl de crème", "150g de gruyère râpé"],
            preparation: "Faites cuire vos pâtes dans l'eau bouillante, mais gardez-les un peu dures, puis enlevez l'eau.\nDans un grand plat, mélangez les pâtes avec la crème et le jambon coupé en petits carrés.\nRecouvrez généreusement de gruyère et mettez le tout au four 20 minutes à 200°C pour faire fondre le fromage.\nEnfin, vous pourrez récupérer votre gratin bien doré et le servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 16,
        titre: "Pâtes pesto",
        ingredients: "Pâtes, sauce pesto, parmesan, pignons de pin",
        image: "assets/images/plat16.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "15 minutes",
            ustensiles: ["Casserole"],
            ingredientsComplets: ["400g de pâtes", "1 pot de sauce pesto", "50g de parmesan", "Quelques pignons de pin"],
            preparation: "Faites cuire vos pâtes dans une grande casserole remplie d'eau bouillante.\nEnlevez l'eau et remettez les pâtes dans la casserole.\nAjoutez la sauce pesto et mélangez bien le tout pour donner une belle couleur verte, en baissant la puissance des plaques au minimum.\nEnfin, vous pourrez servir vos pâtes dans des assiettes et ajouter un peu de parmesan par-dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 17,
        titre: "Pâtes 4 fromages",
        ingredients: "Pâtes, roquefort, chèvre, gruyère, parmesan, crème",
        image: "assets/images/plat17.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "20 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["400g de pâtes", "20cl de crème fraîche", "4 fromages au choix (roquefort, chèvre, gruyère, parmesan)"],
            preparation: "Faites cuire vos pâtes dans l'eau bouillante.\nDans une poêle, faites chauffer la crème et ajoutez tous les fromages coupés en petits morceaux, en baissant la puissance des plaques pour qu'ils fondent doucement.\nMélangez vos pâtes sans leur eau avec cette sauce très gourmande.\nEnfin, vous pourrez servir vos pâtes bien fromagères dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 18,
        titre: "Frites parfaites",
        ingredients: "Pommes de terre, huile de friture, sel",
        image: "assets/images/plat18.jpg",
        details: {
            provenance: "Belgique",
            tempsCuisine: "45 minutes",
            ustensiles: ["Friteuse ou grande poêle creuse"],
            ingredientsComplets: ["1kg de pommes de terre pour frites", "Huile de friture", "Du sel"],
            preparation: "Épluchez les pommes de terre et coupez-les en bâtonnets réguliers.\nFaites-les cuire une première fois dans l'huile chaude pendant 6 minutes sans les faire dorer, puis sortez-les.\nAugmentez la chaleur de l'huile et plongez-les une deuxième fois pour les rendre bien croustillantes et dorées.\nEnfin, vous pourrez récupérer vos frites, ajouter du sel et les servir dans un grand bol.\nEt régalez-vous !"
        }
    },
    {
        id: 19,
        titre: "Frites de patate douce",
        ingredients: "Patates douces, huile d'olive, paprika, sel",
        image: "assets/images/plat19.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "35 minutes",
            ustensiles: ["Plaque de four"],
            ingredientsComplets: ["2 grosses patates douces", "3 cuillères à soupe d'huile d'olive", "Du paprika", "Du sel"],
            preparation: "Épluchez les patates douces et coupez-les en forme de frites.\nMettez-les dans un grand saladier, versez l'huile, le paprika, le sel et mélangez bien avec vos mains.\nÉtalez-les sur la plaque et mettez le tout au four 30 minutes à 200°C.\nEnfin, vous pourrez récupérer vos frites colorées et les servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 20,
        titre: "Frites au fromage",
        ingredients: "Frites, cheddar fondu, lardons",
        image: "assets/images/plat20.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "25 minutes",
            ustensiles: ["Plaque de four", "Poêle"],
            ingredientsComplets: ["500g de frites (surgelées ou fraîches)", "150g de cheddar râpé", "100g de lardons"],
            preparation: "Faites cuire vos frites au four ou à la friteuse selon vos habitudes.\nPendant ce temps, faites dorer les lardons dans une poêle sans huile.\nMettez les frites chaudes dans un plat, ajoutez les lardons, recouvrez de cheddar et mettez le tout au four 5 minutes pour fondre le fromage.\nEnfin, vous pourrez récupérer ce plat très gourmand et le servir directement.\nEt régalez-vous !"
        }
    },
    {
        id: 21,
        titre: "Nuggets de poulet",
        ingredients: "Poulet, farine, œufs, chapelure, huile",
        image: "assets/images/plat21.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "25 minutes",
            ustensiles: ["Poêle", "3 assiettes creuses"],
            ingredientsComplets: ["3 blancs de poulet", "1 verre de farine", "2 œufs", "1 verre de chapelure", "Huile de cuisson"],
            preparation: "Coupez le poulet en petits morceaux.\nTrempez chaque morceau d'abord dans la farine, puis dans les œufs battus, et enfin dans la chapelure.\nFaites cuire les nuggets dans une poêle avec un peu d'huile chaude jusqu'à ce qu'ils soient bien dorés et croustillants.\nEnfin, vous pourrez récupérer vos nuggets et les servir dans des assiettes avec de la sauce.\nEt régalez-vous !"
        }
    },
    {
        id: 22,
        titre: "Burger végétarien aux lentilles",
        ingredients: "Pains burger, lentilles, carottes, salade, tomate",
        image: "assets/images/plat22.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "30 minutes",
            ustensiles: ["Poêle", "Saladier"],
            ingredientsComplets: ["2 pains à burger", "1 boîte de lentilles", "1 carotte râpée", "De la salade", "1 tomate"],
            preparation: "Écrasez les lentilles sans leur jus et mélangez-les avec la carotte râpée pour former de gros palets ronds avec vos mains.\nFaites dorer ces palets végétaux dans une poêle chaude avec un peu d'huile.\nFaites chauffer vos pains, puis mettez la salade, la tomate et votre palet de lentilles chaud à l'intérieur.\nEnfin, vous pourrez refermer vos burgers et les servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 23,
        titre: "Burger au saumon fumé",
        ingredients: "Pains burger, saumon fumé, fromage frais, avocat, citron",
        image: "assets/images/plat23.jpg",
        details: {
            provenance: "Internationale",
            tempsCuisine: "10 minutes",
            ustensiles: ["Couteau"],
            ingredientsComplets: ["2 pains à burger", "4 tranches de saumon fumé", "Du fromage frais (type St Môret)", "1 avocat", "Un peu de jus de citron"],
            preparation: "Faites légèrement griller vos pains à burger pour qu'ils soient croustillants.\nÉtalez une bonne couche de fromage frais sur la base du pain.\nAjoutez l'avocat coupé en tranches, quelques gouttes de citron, puis les tranches de saumon fumé par-dessus.\nEnfin, vous pourrez refermer le pain et servir vos burgers frais dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 24,
        titre: "Chicken Burger",
        ingredients: "Pains burger, poulet pané, mayonnaise, salade, cheddar",
        image: "assets/images/plat24.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "20 minutes",
            ustensiles: ["Poêle"],
            ingredientsComplets: ["2 pains à burger", "2 beaux morceaux de poulet pané", "De la mayonnaise", "De la salade croquante", "2 tranches de cheddar"],
            preparation: "Faites dorer le poulet pané dans une poêle chaude avec un peu d'huile pour qu'il soit bien croustillant.\nJuste avant la fin, posez le cheddar sur le poulet chaud pour qu'il fonde légèrement.\nFaites chauffer vos pains, étalez la mayonnaise, posez la salade puis le poulet recouvert de fromage.\nEnfin, vous pourrez fermer le burger et le servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 25,
        titre: "Hot-dog",
        ingredients: "Pains longs, saucisses, moutarde, ketchup, oignons frits",
        image: "assets/images/plat25.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "10 minutes",
            ustensiles: ["Casserole"],
            ingredientsComplets: ["2 pains à hot-dog", "2 saucisses de Strasbourg", "De la moutarde et du ketchup", "Des oignons frits croustillants"],
            preparation: "Faites cuire vos saucisses dans une casserole d'eau chaude pendant quelques minutes pour les réchauffer sans les faire éclater, en baissant la puissance des plaques.\nOuvrez vos pains en deux et faites-les légèrement chauffer.\nPlacez une saucisse chaude dans chaque pain, puis ajoutez les sauces et les oignons par-dessus.\nEnfin, vous pourrez servir vos hot-dogs bien garnis directement.\nEt régalez-vous !"
        }
    },
    {
        id: 26,
        titre: "Wrap au poulet",
        ingredients: "Galettes, poulet, tomates, salade, sauce blanche",
        image: "assets/images/plat26.jpg",
        details: {
            provenance: "Mexique",
            tempsCuisine: "15 minutes",
            ustensiles: ["Poêle"],
            ingredientsComplets: ["2 grandes galettes de blé (tortillas)", "2 blancs de poulet", "1 tomate", "De la salade", "De la sauce blanche ou yaourt"],
            preparation: "Faites dorer le poulet coupé en petits morceaux dans une poêle chaude.\nÉtalez un peu de sauce sur vos galettes de blé posées à plat.\nAjoutez le poulet chaud, des petits morceaux de tomate et la salade au centre de la galette.\nEnfin, vous pourrez rouler la galette très fort pour la fermer et servir vos wraps dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 27,
        titre: "Pizza margherita",
        ingredients: "Pâte à pizza, sauce tomate, mozzarella, basilic",
        image: "assets/images/plat27.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "25 minutes",
            ustensiles: ["Plaque de four"],
            ingredientsComplets: ["1 pâte à pizza", "4 cuillères de sauce tomate", "2 boules de mozzarella", "Quelques feuilles de basilic frais"],
            preparation: "Étalez votre pâte à pizza sur la plaque du four.\nVersez et étalez la sauce tomate, puis ajoutez la mozzarella coupée en petits morceaux partout sur la pâte.\nMettez le tout au four 15 minutes à 220°C pour que la croûte soit bien dorée.\nEnfin, vous pourrez sortir la pizza, ajouter le basilic frais et la servir coupée en parts.\nEt régalez-vous !"
        }
    },
    {
        id: 28,
        titre: "Pizza 4 fromages",
        ingredients: "Pâte à pizza, crème fraîche, roquefort, chèvre, mozzarella, emmental",
        image: "assets/images/plat28.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "25 minutes",
            ustensiles: ["Plaque de four"],
            ingredientsComplets: ["1 pâte à pizza", "De la crème fraîche", "Du roquefort, du chèvre, de la mozzarella et de l'emmental râpé"],
            preparation: "Étalez votre pâte à pizza sur la plaque du four.\nMettez une belle couche de crème fraîche comme base, puis répartissez tous les fromages coupés en morceaux.\nMettez le tout au four 15 minutes à 220°C jusqu'à ce que les fromages fassent de grosses bulles dorées.\nEnfin, vous pourrez couper la pizza en parts bien chaudes et la servir.\nEt régalez-vous !"
        }
    },
    {
        id: 29,
        titre: "Pizza pepperoni",
        ingredients: "Pâte à pizza, sauce tomate, mozzarella, tranches de pepperoni",
        image: "assets/images/plat29.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "25 minutes",
            ustensiles: ["Plaque de four"],
            ingredientsComplets: ["1 pâte à pizza", "De la sauce tomate", "De la mozzarella", "15 tranches de pepperoni (ou chorizo doux)"],
            preparation: "Étalez votre pâte à pizza sur la plaque du four et recouvrez-la de sauce tomate.\nAjoutez la mozzarella coupée en morceaux, puis posez les tranches de pepperoni par-dessus de manière uniforme.\nMettez le tout au four 15 minutes à 220°C pour que la viande dore légèrement.\nEnfin, vous pourrez sortir votre pizza croustillante et la servir dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 30,
        titre: "Pizza végétarienne",
        ingredients: "Pâte à pizza, sauce tomate, poivrons, oignons, champignons, olives",
        image: "assets/images/plat30.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "30 minutes",
            ustensiles: ["Plaque de four", "Poêle"],
            ingredientsComplets: ["1 pâte à pizza", "Sauce tomate", "1 poivron", "1 oignon", "Des champignons", "Quelques olives noires"],
            preparation: "Faites légèrement cuire les légumes coupés en petits morceaux dans une poêle chaude pour qu'ils soient tendres.\nÉtalez votre pâte, mettez la sauce tomate, puis ajoutez tous vos légumes et les olives.\nMettez le tout au four 15 minutes à 220°C.\nEnfin, vous pourrez récupérer votre pizza bien colorée et la servir coupée en parts.\nEt régalez-vous !"
        }
    },
    {
        id: 31,
        titre: "Purée de pommes de terre",
        ingredients: "Pommes de terre, lait, beurre, sel, muscade",
        image: "assets/images/plat31.jpg",
        details: {
            provenance: "Monde entier",
            tempsCuisine: "30 minutes",
            ustensiles: ["Casserole", "Écrase-purée ou fourchette"],
            ingredientsComplets: ["1kg de pommes de terre", "20cl de lait", "50g de beurre", "Du sel et une pincée de noix de muscade"],
            preparation: "Faites cuire les pommes de terre épluchées dans une grande casserole d'eau bouillante jusqu'à ce qu'elles soient très molles.\nEnlevez l'eau, puis écrasez les pommes de terre directement dans la casserole chaude.\nAjoutez le lait, le beurre, le sel et la muscade, et mélangez bien, en baissant la puissance des plaques au minimum.\nEnfin, vous pourrez servir votre belle purée bien lisse dans des assiettes ou des bols.\nEt régalez-vous !"
        }
    },
    {
        id: 32,
        titre: "Soupe de pommes de terre",
        ingredients: "Pommes de terre, bouillon, oignons, crème, ciboulette",
        image: "assets/images/plat32.jpg",
        details: {
            provenance: "Europe",
            tempsCuisine: "35 minutes",
            ustensiles: ["Casserole", "Mixeur plongeant"],
            ingredientsComplets: ["800g de pommes de terre", "1 oignon", "1 bouillon cube", "10cl de crème fraîche", "Ciboulette"],
            preparation: "Faites dorer l'oignon coupé dans une grande casserole chaude, puis ajoutez les pommes de terre en morceaux.\nRecouvrez d'eau, ajoutez le bouillon cube et laissez mijoter doucement 20 minutes, en baissant la puissance des plaques.\nUne fois les pommes de terre molles, mixez le tout pour ne plus avoir de morceaux, puis ajoutez la crème.\nEnfin, vous pourrez servir cette soupe onctueuse dans des bols avec un peu de ciboulette dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 33,
        titre: "Omelette",
        ingredients: "Œufs, beurre, sel, poivre",
        image: "assets/images/plat33.jpg",
        details: {
            provenance: "France",
            tempsCuisine: "10 minutes",
            ustensiles: ["Poêle", "Saladier"],
            ingredientsComplets: ["3 ou 4 œufs par personne", "Un petit morceau de beurre", "Du sel et du poivre"],
            preparation: "Battez vos œufs dans un saladier avec le sel et le poivre jusqu'à ce que ce soit bien liquide.\nFaites fondre le beurre dans une poêle chaude, puis versez les œufs battus.\nLaissez cuire doucement, en baissant un peu la puissance des plaques, et pliez l'omelette en deux quand elle est cuite en dessous mais encore un peu baveuse dessus.\nEnfin, vous pourrez faire glisser l'omelette et la servir dans une assiette.\nEt régalez-vous !"
        }
    },
    {
        id: 34,
        titre: "Œufs brouillés",
        ingredients: "Œufs, crème liquide, beurre, sel, poivre",
        image: "assets/images/plat34.jpg",
        details: {
            provenance: "Royaume-Uni",
            tempsCuisine: "10 minutes",
            ustensiles: ["Poêle"],
            ingredientsComplets: ["3 œufs par personne", "1 cuillère à soupe de crème liquide", "Un petit bout de beurre", "Du sel et du poivre"],
            preparation: "Cassez les œufs directement dans une poêle froide avec le beurre.\nAllumez vos plaques doucement et mélangez sans arrêt avec une cuillère en bois.\nQuand ça commence à cuire mais que c'est encore très crémeux, sortez du feu, ajoutez la crème liquide et mélangez bien.\nEnfin, vous pourrez servir vos œufs brouillés très doux dans des assiettes avec du pain grillé.\nEt régalez-vous !"
        }
    },
    {
        id: 35,
        titre: "Bœuf Bourguignon",
        ingredients: "Bœuf, vin rouge, lardons, oignons, champignons, carottes",
        image: "assets/images/plat35.jpg",
        details: {
            provenance: "France (Bourgogne)",
            tempsCuisine: "3 heures",
            ustensiles: ["Grande cocotte"],
            ingredientsComplets: ["800g de viande de bœuf à mijoter", "1 bouteille de vin rouge", "100g de lardons", "2 carottes", "1 oignon", "Des champignons"],
            preparation: "Faites dorer les morceaux de viande, l'oignon et les lardons dans une grande cocotte bien chaude.\nAjoutez les carottes coupées, puis recouvrez le tout avec le vin rouge.\nLaissez mijoter doucement pendant au moins 2h30 avec un couvercle, en baissant la puissance des plaques au minimum, et ajoutez les champignons à la fin.\nEnfin, vous pourrez servir cette viande très fondante dans des assiettes avec des pâtes ou des pommes de terre.\nEt régalez-vous !"
        }
    },
    {
        id: 36,
        titre: "Tartiflette",
        ingredients: "Pommes de terre, reblochon, lardons, oignons, crème fraîche",
        image: "assets/images/plat36.jpg",
        details: {
            provenance: "France (Savoie)",
            tempsCuisine: "50 minutes",
            ustensiles: ["Poêle", "Plat à gratin"],
            ingredientsComplets: ["1kg de pommes de terre", "1 fromage Reblochon entier", "200g de lardons", "2 gros oignons", "3 grosses cuillères de crème fraîche"],
            preparation: "Faites cuire les pommes de terre épluchées dans l'eau bouillante, puis coupez-les en rondelles.\nFaites dorer les lardons et les oignons coupés en morceaux dans une poêle chaude.\nDans le plat, mettez la moitié des pommes de terre, le mélange lardons-oignons, la crème, le reste des pommes de terre, et posez le reblochon coupé en deux par-dessus.\nMettez le tout au four 25 minutes à 200°C.\nEnfin, vous pourrez servir ce grand classique bien fondant dans des assiettes.\nEt régalez-vous !"
        }
    },
    {
        id: 37,
        titre: "Cassoulet",
        ingredients: "Haricots blancs, saucisses de Toulouse, confit de canard, tomate",
        image: "assets/images/plat37.jpg",
        details: {
            provenance: "France (Sud-Ouest)",
            tempsCuisine: "2 heures",
            ustensiles: ["Grande cocotte ou plat en terre cuite"],
            ingredientsComplets: ["500g de haricots blancs", "4 saucisses de Toulouse", "2 cuisses de confit de canard", "Un peu de purée de tomate", "De l'ail"],
            preparation: "Faites cuire les haricots dans beaucoup d'eau pendant très longtemps jusqu'à ce qu'ils soient mous.\nFaites dorer les saucisses et le canard dans une poêle bien chaude pour faire fondre la graisse.\nMettez la viande et les haricots avec un peu de tomate dans votre plat, et mettez le tout au four 1 heure à 160°C pour créer une croûte sur le dessus.\nEnfin, vous pourrez servir ce plat très réconfortant dans des assiettes creuses.\nEt régalez-vous !"
        }
    },
    {
        id: 38,
        titre: "Pot-au-feu",
        ingredients: "Bœuf, carottes, poireaux, navets, pommes de terre, bouillon",
        image: "assets/images/plat38.jpg",
        details: {
            provenance: "France",
            tempsCuisine: "3 heures",
            ustensiles: ["Grande marmite"],
            ingredientsComplets: ["1kg de viande de bœuf (macreuse ou paleron)", "4 carottes", "3 poireaux", "3 navets", "6 pommes de terre"],
            preparation: "Mettez la viande dans une grande marmite remplie d'eau froide et faites chauffer jusqu'à faire des bulles.\nCoupez tous vos légumes en très gros morceaux et mettez-les dans l'eau avec la viande.\nLaissez mijoter doucement pendant 3 heures avec un couvercle, en baissant la puissance des plaques pour que la viande devienne très molle.\nEnfin, vous pourrez récupérer la viande et les légumes pour les servir dans de grandes assiettes avec un peu de moutarde.\nEt régalez-vous !"
        }
    },
    {
        id: 39,
        titre: "Ratatouille",
        ingredients: "Aubergines, courgettes, poivrons, tomates, oignons, ail",
        image: "assets/images/plat39.jpg",
        details: {
            provenance: "France (Provence)",
            tempsCuisine: "1 heure",
            ustensiles: ["Grande cocotte ou poêle large"],
            ingredientsComplets: ["2 aubergines", "2 courgettes", "1 poivron rouge et 1 jaune", "4 tomates", "1 oignon et de l'ail"],
            preparation: "Coupez tous les légumes en petits carrés de la même taille.\nFaites dorer les oignons, l'ail et les poivrons dans la cocotte avec beaucoup d'huile d'olive.\nAjoutez ensuite les aubergines, les courgettes et les tomates, et laissez mijoter doucement 45 minutes, en baissant la puissance des plaques, pour que tous les légumes fondent ensemble.\nEnfin, vous pourrez servir cette belle ratatouille colorée dans des assiettes, chaude ou froide.\nEt régalez-vous !"
        }
    },
    {
        id: 40,
        titre: "Quiche lorraine",
        ingredients: "Pâte brisée, lardons, œufs, crème fraîche, lait",
        image: "assets/images/plat40.jpg",
        details: {
            provenance: "France (Lorraine)",
            tempsCuisine: "45 minutes",
            ustensiles: ["Moule à tarte", "Poêle", "Saladier"],
            ingredientsComplets: ["1 pâte brisée", "200g de lardons fumés", "3 œufs", "20cl de crème fraîche", "10cl de lait"],
            preparation: "Déroulez votre pâte brisée dans le moule et faites des petits trous avec une fourchette au fond.\nFaites cuire les lardons dans une poêle sans huile, puis enlevez le gras fondu et posez-les sur la pâte.\nDans le saladier, mélangez les œufs, la crème, le lait, un peu de poivre, et versez ce liquide sur les lardons.\nMettez le tout au four 30 minutes à 180°C.\nEnfin, vous pourrez couper votre quiche et la servir avec une salade verte.\nEt régalez-vous !"
        }
    },
    {
        id: 41,
        titre: "Risotto",
        ingredients: "Riz à risotto, bouillon, oignons, vin blanc, parmesan",
        image: "assets/images/plat41.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "30 minutes",
            ustensiles: ["Casserole ou poêle creuse"],
            ingredientsComplets: ["300g de riz rond (Arborio)", "1 litre de bouillon chaud", "1 oignon", "1 petit verre de vin blanc", "100g de parmesan râpé"],
            preparation: "Faites dorer l'oignon coupé très fin dans un peu de beurre, puis ajoutez le riz sec et mélangez jusqu'à ce qu'il devienne un peu transparent.\nVersez le vin blanc, puis ajoutez le bouillon chaud louche par louche, en attendant que l'eau disparaisse à chaque fois.\nMélangez doucement et sans arrêt pendant 20 minutes, en baissant la puissance des plaques.\nEnfin, enlevez du feu, ajoutez le parmesan et un beau morceau de beurre, puis servez vite dans des assiettes creuses.\nEt régalez-vous !"
        }
    },
    {
        id: 42,
        titre: "Gnocchis",
        ingredients: "Gnocchis, beurre, sauge, parmesan (ou sauce tomate)",
        image: "assets/images/plat42.jpg",
        details: {
            provenance: "Italie",
            tempsCuisine: "10 minutes",
            ustensiles: ["Casserole", "Poêle"],
            ingredientsComplets: ["500g de gnocchis frais", "Du beurre", "Quelques feuilles de sauge fraîche", "Du parmesan râpé"],
            preparation: "Faites cuire les gnocchis dans une grande casserole d'eau bouillante (ils sont cuits quand ils remontent tous seuls à la surface !), puis enlevez l'eau.\nDans une poêle, faites fondre beaucoup de beurre avec les feuilles de sauge, en baissant la puissance des plaques.\nAjoutez les gnocchis dans ce beurre pour les enrober de sauce.\nEnfin, vous pourrez servir vos gnocchis dans des assiettes en ajoutant du parmesan par-dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 43,
        titre: "Paëlla",
        ingredients: "Riz, poulet, crevettes, moules, chorizo, petits pois, safran",
        image: "assets/images/plat43.jpg",
        details: {
            provenance: "Espagne",
            tempsCuisine: "1 heure",
            ustensiles: ["Très grande poêle plate (à paëlla)"],
            ingredientsComplets: ["300g de riz", "Morceaux de poulet", "Crevettes et moules", "1 chorizo", "Poivrons et petits pois", "Du bouillon au safran (jaune)"],
            preparation: "Faites dorer le poulet, le chorizo coupé et les poivrons dans la grande poêle chaude.\nAjoutez le riz cru, mélangez bien, puis versez le bouillon chaud tout jaune par-dessus.\nPlacez les crevettes, les moules et les petits pois sur le dessus pour faire joli, et laissez mijoter doucement sans jamais mélanger le riz, en baissant la puissance des plaques.\nEnfin, quand toute l'eau a disparu, vous pourrez apporter la poêle au milieu de la table et servir vos invités.\nEt régalez-vous !"
        }
    },
    {
        id: 44,
        titre: "Gazpacho",
        ingredients: "Tomates, poivrons, concombres, oignons, ail, huile d'olive",
        image: "assets/images/plat44.jpg",
        details: {
            provenance: "Espagne",
            tempsCuisine: "15 minutes",
            ustensiles: ["Mixeur (Blender)"],
            ingredientsComplets: ["1kg de tomates bien rouges", "1 petit poivron rouge", "1 demi concombre", "1 petit oignon", "De l'huile d'olive et un peu de vinaigre"],
            preparation: "Coupez les tomates, le poivron, le concombre et l'oignon en gros morceaux crus.\nMettez tout dans votre mixeur avec un bon filet d'huile d'olive, un peu de vinaigre, du sel et un verre d'eau très froide.\nMixez le tout à pleine puissance pendant longtemps pour avoir une soupe complètement lisse et liquide.\nEnfin, placez au frigo et vous pourrez servir cette soupe très froide dans des bols.\nEt régalez-vous !"
        }
    },
    {
        id: 45,
        titre: "Tortilla espagnole",
        ingredients: "Pommes de terre, oignons, œufs, huile d'olive",
        image: "assets/images/plat45.jpg",
        details: {
            provenance: "Espagne",
            tempsCuisine: "40 minutes",
            ustensiles: ["Poêle", "Saladier"],
            ingredientsComplets: ["4 grosses pommes de terre", "1 gros oignon", "6 œufs", "Beaucoup d'huile d'olive"],
            preparation: "Coupez les pommes de terre et l'oignon en fines tranches, et faites-les cuire dans la poêle pleine d'huile chaude jusqu'à ce que ce soit très mou (pas croustillant).\nEnlevez l'huile, et mélangez les légumes chauds avec les œufs battus dans un saladier.\nRemettez tout ce mélange dans la poêle avec un peu d'huile et laissez cuire doucement pour former une grosse omelette très épaisse, en baissant la puissance des plaques.\nEnfin, retournez-la avec une assiette pour cuire l'autre côté, puis vous pourrez la servir coupée en parts.\nEt régalez-vous !"
        }
    },
    {
        id: 46,
        titre: "Nouilles sautées",
        ingredients: "Nouilles chinoises, poulet, carottes, sauce soja, oignons verts",
        image: "assets/images/plat46.jpg",
        details: {
            provenance: "Asie",
            tempsCuisine: "20 minutes",
            ustensiles: ["Wok ou grande poêle"],
            ingredientsComplets: ["Sachet de nouilles chinoises aux œufs", "2 filets de poulet", "2 carottes en bâtonnets", "Sauce soja", "Des petits oignons verts"],
            preparation: "Faites tremper vos nouilles dans l'eau chaude selon le paquet pour les ramollir, puis enlevez l'eau.\nDans un wok très chaud, faites dorer le poulet coupé et les carottes avec un peu d'huile.\nAjoutez les nouilles molles et la sauce soja, puis mélangez très vite à pleine puissance pendant 2 minutes.\nEnfin, vous pourrez servir ce plat rapide dans des bols avec les petits oignons verts coupés dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 47,
        titre: "Nems",
        ingredients: "Galettes de riz, viande hachée (porc ou poulet), vermicelles, carottes, champignons noirs",
        image: "assets/images/plat47.jpg",
        details: {
            provenance: "Viêt Nam",
            tempsCuisine: "1 heure",
            ustensiles: ["Poêle ou friteuse", "Saladier"],
            ingredientsComplets: ["Galettes de riz sèches", "300g de viande hachée (poulet ou porc)", "Vermicelles transparents", "Carottes râpées", "Champignons noirs trempés dans l'eau"],
            preparation: "Mélangez la viande crue, les légumes et les vermicelles mous dans un saladier pour faire la farce.\nTrempez une galette de riz dans l'eau tiède pour la rendre molle, mettez de la farce au milieu, et roulez-la pour faire un beau petit boudin bien fermé.\nFaites cuire ces petits rouleaux dans une poêle remplie d'huile chaude pour qu'ils deviennent très croustillants.\nEnfin, vous pourrez sortir vos nems dorés et les servir avec des feuilles de salade et de la sauce.\nEt régalez-vous !"
        }
    },
    {
        id: 48,
        titre: "Rouleaux de printemps",
        ingredients: "Galettes de riz, crevettes, vermicelles, salade, menthe, carottes",
        image: "assets/images/plat48.jpg",
        details: {
            provenance: "Viêt Nam",
            tempsCuisine: "30 minutes",
            ustensiles: ["Assiette creuse pour l'eau tiède"],
            ingredientsComplets: ["Galettes de riz sèches", "De belles crevettes cuites", "Vermicelles transparents cuits", "De la salade fraîche", "Feuilles de menthe", "Carottes râpées"],
            preparation: "Trempez une galette de riz dans l'eau tiède pendant quelques secondes pour qu'elle devienne molle et transparente.\nPosez-la à plat, mettez des feuilles de menthe, des crevettes coupées en deux, de la salade, des carottes et des vermicelles.\nRoulez la galette doucement mais fermement pour bien enfermer tous les ingrédients sans la déchirer.\nEnfin, vous pourrez servir ces rouleaux tout frais dans des assiettes avec une sauce aux cacahuètes.\nEt régalez-vous !"
        }
    },
    {
        id: 49,
        titre: "Mac and cheese",
        ingredients: "Macaronis, cheddar, lait, beurre, farine",
        image: "assets/images/plat49.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "25 minutes",
            ustensiles: ["Casserole (pour les pâtes)", "Casserole (pour la sauce)"],
            ingredientsComplets: ["400g de macaronis (pâtes coudées)", "250g de cheddar orange râpé", "50cl de lait", "50g de beurre", "2 cuillères de farine"],
            preparation: "Faites cuire les macaronis dans l'eau bouillante, puis enlevez l'eau.\nDans une autre casserole chaude, faites fondre le beurre, ajoutez la farine, puis versez le lait petit à petit pour faire une crème (une béchamel), en baissant la puissance des plaques.\nAjoutez tout le cheddar râpé dans cette crème pour avoir une sauce orange très coulante.\nEnfin, mélangez cette sauce fromagère avec vos pâtes et vous pourrez les servir dans de gros bols.\nEt régalez-vous !"
        }
    },
    {
        id: 50,
        titre: "Pancakes",
        ingredients: "Farine, lait, œufs, beurre fondu, sucre, levure",
        image: "assets/images/plat50.jpg",
        details: {
            provenance: "États-Unis",
            tempsCuisine: "20 minutes",
            ustensiles: ["Saladier", "Poêle plate"],
            ingredientsComplets: ["2 verres de farine", "1 verre et demi de lait", "2 œufs", "2 cuillères de beurre fondu", "2 cuillères de sucre", "1 sachet de levure chimique"],
            preparation: "Mélangez tous les ingrédients dans un grand saladier avec un fouet pour obtenir une pâte épaisse sans grumeaux.\nFaites chauffer une poêle avec un tout petit peu de beurre.\nVersez une petite louche de pâte pour faire un rond, et retournez-le quand des petites bulles éclatent sur le dessus.\nEnfin, vous pourrez empiler vos beaux pancakes bien gonflés dans une assiette et verser du sirop d'érable dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 51,
        titre: "Crêpes",
        ingredients: "Farine, lait, œufs, beurre, sucre",
        image: "assets/images/plat51.jpg",
        details: {
            provenance: "France (Bretagne)",
            tempsCuisine: "20 minutes",
            ustensiles: ["Saladier", "Poêle à crêpes"],
            ingredientsComplets: ["250g de farine", "50cl de lait", "3 œufs", "50g de beurre fondu", "Un peu de sucre"],
            preparation: "Dans un saladier, mettez la farine, faites un trou au milieu pour ajouter les œufs, puis mélangez en versant le lait très doucement pour ne pas faire de morceaux.\nFaites bien chauffer votre poêle avec une goutte d'huile.\nVersez une louche de cette pâte très liquide, bougez la poêle pour l'étaler partout en couche très fine, et retournez-la au bout d'une minute.\nEnfin, vous pourrez servir vos grandes crêpes chaudes avec du chocolat, du sucre ou de la confiture.\nEt régalez-vous !"
        }
    },
    {
        id: 52,
        titre: "Churros au chocolat",
        ingredients: "Farine, eau, sel, sucre, huile de friture, chocolat fondu",
        image: "assets/images/plat52.jpg",
        details: {
            provenance: "Espagne",
            tempsCuisine: "25 minutes",
            ustensiles: ["Casserole", "Friteuse ou grande poêle", "Poche à douille (ou sac percé)"],
            ingredientsComplets: ["1 verre de farine", "1 verre d'eau", "Une pincée de sel", "Du sucre en poudre", "De l'huile pour frire", "Du chocolat fondu"],
            preparation: "Faites bouillir l'eau avec le sel dans une casserole, puis ajoutez toute la farine d'un coup et mélangez très fort avec une cuillère en bois pour faire une grosse boule de pâte collante.\nMettez cette pâte dans une poche à douille et faites tomber de grands bâtons de pâte directement dans l'huile très chaude.\nLaissez-les dorer pour qu'ils deviennent très croustillants, puis sortez-les et roulez-les dans le sucre.\nEnfin, vous pourrez servir vos churros avec un petit bol de chocolat chaud fondu pour les tremper dedans.\nEt régalez-vous !"
        }
    },
    {
        id: 53,
        titre: "Couscous",
        ingredients: "Semoule, poulet, merguez, courgettes, carottes, pois chiches, bouillon",
        image: "assets/images/plat53.jpg",
        details: {
            provenance: "Maghreb",
            tempsCuisine: "1 heure et 30 minutes",
            ustensiles: ["Couscoussier ou Grande marmite"],
            ingredientsComplets: ["De la semoule fine ou moyenne", "Des cuisses de poulet et des merguez", "Courgettes, carottes et navets", "Une boîte de pois chiches", "Épices (Ras el hanout) et bouillon"],
            preparation: "Faites dorer le poulet dans une grande marmite, ajoutez les légumes coupés en gros morceaux, les épices, les pois chiches, et recouvrez d'eau.\nLaissez mijoter doucement pour faire un bon bouillon qui a du goût, en baissant la puissance des plaques.\nPréparez la semoule à part en lui ajoutant de l'eau chaude et un peu de beurre pour la rendre bien gonflée et douce, et faites cuire vos merguez dans une poêle.\nEnfin, vous pourrez servir la semoule dans une grande assiette creuse, déposer la viande, les légumes, et verser le bouillon très chaud par-dessus.\nEt régalez-vous !"
        }
    },
    {
        id: 54,
        titre: "Tajine",
        ingredients: "Poulet, citrons confits, olives, oignons, épices",
        image: "assets/images/plat54.jpg",
        details: {
            provenance: "Maroc",
            tempsCuisine: "1 heure et 15 minutes",
            ustensiles: ["Plat à tajine ou Cocotte en fonte avec couvercle"],
            ingredientsComplets: ["Des morceaux de poulet", "2 oignons coupés en tranches", "2 petits citrons jaunes confits", "Des olives vertes", "Épices (curcuma, gingembre, cumin)"],
            preparation: "Dans votre plat ou cocotte chaude, faites dorer le poulet et les oignons avec un peu d'huile et toutes les belles épices jaunes.\nAjoutez un petit verre d'eau, mettez le couvercle, et laissez mijoter très doucement pendant 45 minutes, en baissant la puissance des plaques au maximum.\nAjoutez les olives vertes et l'écorce des citrons confits coupée en morceaux, puis laissez encore cuire 15 minutes.\nEnfin, vous pourrez apporter la cocotte au milieu de la table et servir cette viande très parfumée avec du bon pain.\nEt régalez-vous !"
        }
    },
    {
        id: 55,
        titre: "Chorba",
        ingredients: "Viande d'agneau, tomates, oignons, pois chiches, frik (blé concassé), coriandre",
        image: "assets/images/plat55.jpg",
        details: {
            provenance: "Algérie",
            tempsCuisine: "1 heure",
            ustensiles: ["Grande marmite"],
            ingredientsComplets: ["Des petits morceaux de viande (agneau ou bœuf)", "Du coulis de tomate", "1 oignon mixé", "Des pois chiches", "Un peu de frik (blé vert cassé)", "Beaucoup de coriandre fraîche"],
            preparation: "Faites cuire la viande en petits morceaux dans la marmite chaude avec l'oignon mixé, la coriandre hachée et un peu d'huile.\nAjoutez le coulis de tomate, de l'eau, les pois chiches, et laissez mijoter doucement pour que la viande devienne tendre, en baissant la puissance des plaques.\nVersez une petite poignée de frik (blé concassé) dans la soupe pour l'épaissir et laissez encore cuire 15 minutes.\nEnfin, vous pourrez servir cette soupe traditionnelle bien rouge et brûlante dans des bols avec un filet de jus de citron.\nEt régalez-vous !"
        }
    },
    {
        id: 56,
        titre: "Cheese Naan",
        ingredients: "Farine, yaourt, levure, fromage fondu, beurre",
        image: "assets/images/plat56.jpg",
        details: {
            provenance: "Inde",
            tempsCuisine: "30 minutes",
            ustensiles: ["Saladier", "Poêle", "Rouleau à pâtisserie"],
            ingredientsComplets: ["300g de farine", "1 yaourt nature", "1 sachet de levure chimique", "6 portions de fromage fondu (type Vache qui rit)", "Un peu de beurre fondu"],
            preparation: "Mélangez la farine, le yaourt, la levure et un peu d'eau dans un saladier pour faire une belle pâte douce avec vos mains.\nCoupez la pâte en plusieurs boules, aplatissez-les, mettez le fromage fondu au centre, puis refermez bien pour faire des ronds plats.\nFaites cuire chaque pain dans une poêle très chaude sans huile pendant quelques minutes, en baissant un peu la puissance des plaques, jusqu'à ce qu'ils gonflent et deviennent dorés.\nMettez un peu de beurre fondu dessus avec un pinceau pour les rendre brillants.\nEnfin, vous pourrez servir vos naans au fromage tout chauds et bien coulants.\nEt régalez-vous !"
        }
    },
    {
        id: 57,
        titre: "Chapati",
        ingredients: "Farine de blé, eau, sel, huile",
        image: "assets/images/plat57.jpg",
        details: {
            provenance: "Inde",
            tempsCuisine: "20 minutes",
            ustensiles: ["Saladier", "Poêle plate", "Rouleau à pâtisserie"],
            ingredientsComplets: ["250g de farine complète (ou farine normale)", "15cl d'eau tiède", "1 cuillère d'huile", "Une pincée de sel"],
            preparation: "Mélangez la farine, l'eau, l'huile et le sel dans un grand saladier avec vos mains pour faire une boule de pâte qui ne colle pas.\nCoupez la pâte en petites boules et écrasez-les avec un rouleau pour faire des galettes très fines.\nFaites cuire les galettes une par une dans une poêle très chaude et sans huile, en les retournant dès que des petites bulles apparaissent.\nAppuyez doucement dessus avec un chiffon propre pour les forcer à gonfler comme des ballons.\nEnfin, vous pourrez servir vos chapatis bien chauds pour manger avec vos plats en sauce.\nEt régalez-vous !"
        }
    },
    {
        id: 58,
        titre: "Riz basmati",
        ingredients: "Riz basmati, eau, sel, beurre",
        image: "assets/images/plat58.jpg",
        details: {
            provenance: "Inde",
            tempsCuisine: "20 minutes",
            ustensiles: ["Passoire", "Casserole avec couvercle"],
            ingredientsComplets: ["2 verres de riz basmati", "3 verres d'eau", "Une pincée de sel", "Un petit morceau de beurre"],
            preparation: "Lavez bien le riz dans une passoire sous l'eau froide pour enlever la poudre blanche, jusqu'à ce que l'eau devienne transparente.\nMettez le riz, l'eau et le sel dans une casserole et faites chauffer fort jusqu'à ce que l'eau fasse de grosses bulles.\nMettez le couvercle et laissez cuire très doucement pendant 10 minutes, en baissant la puissance des plaques au minimum, sans jamais ouvrir la casserole.\nÉteignez le feu, laissez reposer 5 minutes sans ouvrir, puis ajoutez le beurre et mélangez doucement avec une fourchette pour séparer les grains.\nEnfin, vous pourrez servir ce riz très parfumé et léger dans de jolis bols.\nEt régalez-vous !"
        }
    }
];

//on crée la route pour renvoyer le tableau JSON quand on va sur /api/recettes
app.get('/api/recettes', (req, res) => {
    res.json(recettes);
});

//configuration de l'envoi d'e-mails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'findarecipe59@gmail.com',
        pass: 'aucwsmjxhpwfslsm'
    }
});

//o route pour envoyer l'alerte e-mail o
app.post('/api/envoyerAlerte', (req, res) => {
    const { username, platTitre } = req.body;

    //on cherche l'email de l'utilisateur dans notre base de données
    db.get(`SELECT email FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Utilisateur introuvable" });

        //on prépare la lettre
        const mailOptions = {
            from: 'findarecipe59@gmail.com',
            to: user.email, //l'email de la personne connectée, récupéré dans la BDD !
            subject: '✿ Une Nouvelle Recette Pour Vous Apparaît Sur Find a Recipe ! ✿',
            text: `Bonjour ${username},\n\nUne nouvelle recette qui correspond à vos alertes vient d'être ajoutée sur Find a Recipe. Son nom est : ${platTitre} !\n\nVenez vite en savoir plus en vous connectant sur le site.\n\nBon appétit !`
        };

        //on envoie le mail !
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Erreur d'envoi d'email:", error);
                return res.status(500).json({ error: "Erreur d'envoi" });
            }
            console.log("Un e-mail vient d'être envoyé à l'adresse " + user.email + " !");
            res.status(200).json({ message: "Email envoyé !" });
        });
    });
});

//route d'inscription, pour créer un compte
app.post('/api/inscription', async (req, res) => {
    //on récupère ce que l'utilisateur a tapé dans le formulaire
    const { username, email, password } = req.body;
    
    //on vérifie que les champs ne sont pas vides
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    //o on vérifie que l'email a un bon format o
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Le format de l'adresse email est invalide." });
    }

    try {
        //on crypte le mot de passe avant de l'enregistrer (niveau de sécurité 10)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        //on insère le nouvel utilisateur dans la base de données
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], function(err) {
            if (err) {
                // si l'email ou le pseudo existe déjà dans la base
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ error: "Cet email ou nom d'utilisateur est déjà utilisé." });
                }
                return res.status(500).json({ error: "Erreur serveur." });
            }
            res.json({ message: "Utilisateur créé avec succès !" });
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du hachage." });
    }
});

//o route de connexion, pour se connecter o
app.post('/api/connexion', (req, res) => {
    //on récupère l'email et le mot de passe tapés
    const { identifier, password } = req.body;

    //on cherche l'utilisateur dans la base de données
    db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [identifier, identifier], async (err, user) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        
        //si l'email n'existe pas
        if (!user) return res.status(400).json({ error: "Utilisateur non trouvé." });

        //on compare le mot de passe tapé avec celui stocké en base
        const match = await bcrypt.compare(password, user.password);
        
        //si les mots de passe ne correspondent pas
        if (!match) return res.status(400).json({ error: "Mot de passe incorrect." });

        //si tout est bon, on crée un badge d'accès (token) valable 2 heures
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '2h' });
        
        //on renvoie le token et un message de succès
        res.json({ message: "Connexion réussie !", token: token, username: user.username });
    });
});

//pour démarrer le serveur
app.listen(port, () => {
    console.log(`✅ API démarrée et accessible sur http://localhost:${port}/api/recettes`);
});