<script lang="ts">
    import type { GenreResponse } from '../types';
    import { env } from '$env/dynamic/public';

    const API_URL = env.PUBLIC_API_URL;

    let url = '';
    let genres: Promise<GenreResponse | null> = Promise.resolve(null);

    const handleFocus = (event: any) => event.target.select();

    const fetchGenres = async () => {
        const response = await fetch(`${API_URL}/api/genres?url=${url}`);
        return response.json();
    };

    const handleChange = () => {
        genres = fetchGenres();
    };

    const everynoise_url = (genre: string) => {
        const genreString = genre.replaceAll(/[ -]/g, '');
        return `https://everynoise.com/engenremap-${genreString}.html`;
    };
</script>

<div class="container">
    <h1 class="header">
        <span class="green">WTF</span> I like this
    </h1>
    <h2 class="subHeader">
        ...what <span class="pink">genre</span> is this?
    </h2>
    <input
        type="text"
        class="input"
        bind:value={url}
        on:focus={handleFocus}
        on:input={handleChange}
        placeholder="Paste the Spotify URL of the track or playlist here..."
    />
    <br />
    <div class="genres">
        {#await genres}
            <span>Loading...</span>
        {:then value}
            {#if value !== null}
                {#if value.genreCounts}
                    {#each value.genreCounts as { genre, count }}
                        <span>
                            <a href={everynoise_url(genre)} target="_blank" rel="noreferrer">
                                {genre}
                            </a>
                            &nbsp; {count}
                        </span>
                    {/each}
                {:else}
                    {#each value.genres as genre}
                        <a href={everynoise_url(genre)} target="_blank" rel="noreferrer">
                            {genre}
                        </a>
                    {/each}
                {/if}
            {/if}
        {:catch error}
            <i>{error}</i>
        {/await}
    </div>
</div>

<style lang="scss">
    @import '../colors.scss';

    .green {
        color: $green;
    }

    .pink {
        color: $purple;
    }

    .container {
        width: 100%;
        height: 100%;
        margin-top: 100px;

        color: white;

        display: grid;
        grid-template-columns: auto 800px auto;
        grid-template-rows: calc(6rem + 2rem) 50px 100px;
        grid-auto-flow: column;
        gap: 20px;
    }

    .header {
        grid-column: 2 / 3;
        grid-row: 1 / 2;

        font-size: 6rem;
        color: $green;
    }

    .subHeader {
        grid-column: 2 / 3;
        grid-row: 1 / 2;

        margin-left: 500px;
        font-size: 1.5rem;
        align-self: flex-end;
        color: $purple;
    }

    .input {
        grid-column: 2 / 3;
        grid-row: 2 / 3;

        padding: 7px;

        font-family: 'Dosis', sans-serif;
        font-size: 1.5rem;
        color: $purple;
        text-align: center;

        background-color: transparent;
        border: 2.5px solid $purple;
        border-radius: 100px;
    }

    .genres {
        grid-column: 2 / 3;
        grid-row: 3 / 4;

        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 20px;

        font-family: 'Dosis', sans-serif;

        a {
            font-size: 2rem;
            color: $red;
            text-decoration-thickness: 1px;
            text-decoration-skip-ink: all;

            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
</style>
