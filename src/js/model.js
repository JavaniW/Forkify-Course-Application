import { async } from 'regenerator-runtime';
import { API_URL, RESULTS_PER_PAGE, KEY } from './config.js';
// import { getJSON, sendJSON } from './helpers.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RESULTS_PER_PAGE,
    pageNumber: 1,
  },
  bookmarks: [],
};

function createRecipeObject(data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
}
export async function loadRecipe(id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);
    console.log(state.recipe);
    if (
      state.bookmarks.some(function (bookmark) {
        return bookmark.id === id;
      })
    ) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    console.error(`${err}💥💥💥💥💥💥`);
    throw err;
  }
}

export async function loadSearchResults(query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    console.log(data);

    state.search.results = data.data.recipes.map(function (recipe) {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };
    });
    state.search.pageNumber = 1;
  } catch (err) {
    console.error(`${err}💥💥💥💥💥💥`);
    throw err;
  }
}

export function getSearchResultsPage(pageNum = state.search.pageNumber) {
  state.search.pageNumber = pageNum;
  const start = (pageNum - 1) * state.search.resultsPerPage; //My Way: pageNum * 10 - 10;
  const end = pageNum * state.search.resultsPerPage; //My Way: pageNum;

  return state.search.results.slice(start, end);
}

export function updateServings(newServings = 1) {
  state.recipe.ingredients.forEach(function (ingr) {
    ingr.quantity = (ingr.quantity * newServings) / state.recipe.servings;
    // newQuanity = quanity * newServings / oldServings
  });
  state.recipe.servings = newServings;
}

function persistBookmarks() {
  localStorage.setItem(`bookmarks`, JSON.stringify(state.bookmarks));
}

function retrievingBookmarks() {}

export function addBookmark(recipe) {
  // Add bookmark
  state.bookmarks.push(recipe);
  // Mark current recipe as bookmark
  if (recipe.id === state.recipe.id) {
    state.recipe.bookmarked = true;
  }
  persistBookmarks();
}

export function removeBookmark(id) {
  const idxOfId = state.bookmarks.find(function (el) {
    return (el.id = id);
  });
  state.bookmarks.splice(idxOfId, 1);

  if (state.recipe.id === id) {
    state.recipe.bookmarked = false;
  }
  persistBookmarks();
}

export async function uploadRecipe(newRecipe) {
  try {
    console.log(newRecipe);
    const ingredients = Object.entries(newRecipe)
      .filter(function ([key, entry]) {
        return key.startsWith(`ingredient`) && entry !== '';
      })
      .map(function ([key, entry]) {
        const ingredientsArray = entry.split(`,`).map(function (el) {
          return el.trim();
        });
        if (ingredientsArray.length !== 3) {
          throw new Error(
            `Wrong ingredient format. Please use the correct format.`
          );
        }
        const [quantity, unit, description] = ingredientsArray;
        return {
          quantity: quantity ? Number(quantity) : null,
          unit,
          description,
        };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: newRecipe.cookingTime,
      servings: newRecipe.servings,
      ingredients,
    };
    // console.log(recipe);
    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    console.log(data);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
}

function init() {
  const storage = localStorage.getItem(`bookmarks`);
  if (storage) {
    state.bookmarks = JSON.parse(storage);
  }
  // console.log(state.bookmarks);
}
init();
function clearBookmarks() {
  localStorage.clear(`bookmarks`);
}
// clearBookmarks();
