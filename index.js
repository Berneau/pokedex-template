import axios from 'axios';
import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const capitalize = (string) => string[0].toUpperCase() + string.substring(1);

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

const normalizePokemon = async (pokemon) => {
    const {
        id,
        name,
        sprites: {
            other: {
                'official-artwork': {
                    front_default: image
                }
            }
        },
        types,
        height,
        weight
    } = pokemon;

    const simpleTypes = types.map(({ type: { name } }) => ({ name: capitalize(name) }));

    return {
        id,
        name,
        capitalizedName: capitalize(name),
        image,
        types: simpleTypes,
        height,
        weight
    };
}

const savePokemonToNotion = async (pokemon) => {
    console.log(pokemon);

    await notion.pages.create({
        parent: { database_id: process.env.DATABASE_ID },
        properties: {
            title: {
                title: [
                    {
                        text: {
                            content: pokemon.capitalizedName
                        }
                    }
                ]
            },
            Id: {
                number: pokemon.id
            },
            Weight: {
                number: pokemon.weight
            },
            Height: {
                number: pokemon.height
            },
            Image: {
                files: [
                    {
                        type: 'external',
                        name: pokemon.name,
                        external: {
                            url: pokemon.image
                        }
                    }
                ]
            },
            Types: {
                multi_select: pokemon.types
            }
        }
    })
}

const run = async () => {

    for (let i = 1; i < 906; i++) {
        const { data: pokemon } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`);

        const normalizedPokemon = await normalizePokemon(pokemon);

        savePokemonToNotion(normalizedPokemon);

        // notion runs into some saving errors without a wait in between
        await sleep(100);
    }
}

Promise.resolve()
    .then(() => run())
    .catch((err) => console.log(err));