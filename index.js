var ytpl = require('ytpl');
const ytdl = require("ytdl-core")
const fs = require("fs")
const rl = require("readline-sync")
const path = require('path');
const https = require('https');

const filepath = rl.question("Path ? : ")
const playlist = rl.question("Playlist Link ? : ")
const MultiProgressBars = require('multi-progress-bars').MultiProgressBars

const mpb = new MultiProgressBars();

let batchurllist = []
function getbatchtxt(url){
    batchurllist.push(url)
    fs.writeFileSync("./Batch.txt",batchurllist.join("\n"))
}
async function batch(pl) {
    const playlist = await ytpl(pl);
    playlist.items.forEach(async (item) => {
        let info = await ytdl.getBasicInfo(item.shortUrl)

        getbatchtxt(info.formats[0].url)
        let video = ytdl(item.shortUrl, {
            quality: '18'
        })
        let filename = info.videoDetails.title.replace(/[/\\?%*:|"<>]/g, '-');
        mpb.addTask(filename, {
            type: 'percentage'
        });
        video.pipe(fs.createWriteStream(filepath + "\\" + filename + ".mp4"))
        video.on("progress", (chunkLength, downloaded, total) => {
            const percent = downloaded / total;
            mpb.updateTask(filename, {
                percentage: percent
            });
        });
        video.on("end", () => {
            console.log()
            console.log(`${filename} Download, Finished`)
            console.log()
            // mpb.done(filename)
        })

        //tracks (Subtitle)
        const lang = 'en';

        // Can be xml, ttml, vtt, srv1, srv2, srv3
        const format = 'ttml';
        if (info.player_response.playerCaptionsTracklistRenderer && info.pl.playerCaptionsTracklistRenderer.captionTracks.length) {
            const tracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;

            const track = tracks.find(t => t.languageCode === lang);
            if (track) {
                const output = `${filepath}\\${filename}.${track.languageCode}.${format}`;
                https.get(`${track.baseUrl}&fmt=${format !== 'xml' ? format : ''}`, res => {
                    res.pipe(fs.createWriteStream(path.resolve(__dirname, output)));
                });
            } else {
                console.log('Could not find captions for', lang);
            }
        } else {
            console.log('No captions found for this video');
        }
    })

}
batch(playlist)