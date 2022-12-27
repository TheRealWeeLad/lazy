window.addEventListener("load", () => {
    const input = document.getElementById('folder');

    let folder_name;
    const sites_div = document.getElementById('sites-container');

    const update_button = document.getElementById('update');
    update_button.addEventListener('click', update);

    const man_button = document.getElementById('man');
    const mon_button = document.getElementById('mon');
    man_button.addEventListener('click', () => { input.value = 'man gg'; update() });
    mon_button.addEventListener('click', () => { input.value = 'mon gg'; update() });

    update();

    function isChapterLast(title) {
        title = title.split(' ');
        return !isNaN(parseInt(title[title.length - 1])) && title[title.length - 2] === '-';
    }
    
    function isValidChapter(title) {
        title = title.split(' ');
        const chap_idx = title.findIndex((e) => e === '-') + 1;
        return !isNaN(parseInt(title[chap_idx]));
    }

    function fixChapter(title) {
        title = title.split(' ');
        const chap_idx = title.findIndex((e) => e === '-') + 1;
        const chapter = title[chap_idx];
        
        let fixed_chapter;
        try {
            fixed_chapter = /\d+/.exec(chapter)[0];
        }
        catch (e) {
            alert('An Error Occurred with "' + title.join(' ').split(' - ')[0] + '"');
            return null;
        }
        title[chap_idx] = fixed_chapter;
        return title.join(' ');
    }

    function processNode(node) {
        if (node.children) {
            if (!node.parentId || node.title === 'Bookmarks bar' || node.title === folder_name) {
                node.children.forEach(child => {
                    processNode(child);
                });
            }
        } else if (node.url) {
            if (node.parentId === '1') return;

            const titles = node.title.split(' / ');
            titles.forEach(title => {
                if (!isValidChapter(title)) {
                    const name = title.split(' - ')[0];
                    alert('Incorrect Format for "' + name + '"');
                    return;
                }

                // Fix Chapter Number
                title = fixChapter(title);

                if (!title) return;

                const title_parts = title.split(' ');

                while (!isChapterLast(title)) {
                    title_parts.pop();
                    title = title_parts.join(' ');
                }
                const site = document.createElement('h4');
                site.class = 'site';
                site.innerText = title_parts.join(' ');

                const plus = document.createElement('img');
                plus.src = 'plus.png';
                const minus = document.createElement('img');
                minus.src = 'minus.png';

                site.appendChild(minus);
                site.appendChild(plus);

                plus.addEventListener('click', () => increment(site, true));
                minus.addEventListener('click', () => increment(site, false));

                sites_div.appendChild(site);
            });
        }
    }

    function processNodeChapter(node, old_title, new_title) {
        if (node.children) {
            if (!node.parentId || node.title === 'Bookmarks bar' || node.title === folder_name) {
                node.children.forEach(child => {
                    return processNodeChapter(child, old_title, new_title);
                });
            }
        } else if (node.url) {
            let node_title = node.title;

            const node_name = node_title.split(' - ');

            if (node_name[0] === old_title.split(' - ')[0]) {
                // Fix Chapter Number
                node_title = fixChapter(node_title);

                const title_parts = node_title.split(' ');

                while (!isChapterLast(node_title)) {
                    const thing = title_parts.pop();
                    node_title = title_parts.join(' ');
                    new_title += ` ${thing}`;
                }
                
                chrome.bookmarks.update(node.id, {title: new_title});
            }
        }
    }

    function increment(site, add) {
        site_parts = site.innerText.split(' - ')
        const old_site_title = site.innerText;

        let chapter = parseInt(site_parts.pop());
        if (add) chapter++;
        else chapter--;

        site_parts.push(chapter.toString());

        const plus = site.children.item(1);
        const minus = site.children.item(0);

        site.innerText = site_parts.join(' - ');
        site.appendChild(minus);
        site.appendChild(plus);

        updateBookmark(old_site_title, site.innerText);
    }

    function updateBookmark(old_title, new_title) {
        chrome.bookmarks.getTree(bmTree => {
            bmTree.forEach(node => {
                processNodeChapter(node, old_title, new_title);
            });
        });
    }

    function update() {
        sites_div.innerHTML = '<h2>Sites: </h2>';

        folder_name = input.value;

        if (folder_name === '') {
            alert('Failed');
            return;
        }

        chrome.bookmarks.getTree(bmTree => {
            bmTree.forEach(node => {
                processNode(node);
            });
        });
    }
});