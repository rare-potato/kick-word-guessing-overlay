Twitch Poll Overlay

Really basic twitch poll overlay that the broadcaster and mods control.

[vfC79jHf.webm](https://github.com/user-attachments/assets/08f6a1b0-7dfd-4509-b195-a81f7b6b8d25)


two commands:

`!setpoll`, `!endpoll`

why is it not !startpoll? idk

`!setpoll|time_in_seconds|PROMPT|OPTION1|OPTION2|etc...`

example: `!setpoll|30|This is the really cool prompt for the poll!|Option1|Option2|Option3|Etc... (can go on forever)`

separate stuff out with | in the setpoll command, that's it! 

users vote with 1, 2, 3, etc...

You can end the poll early with the endpoll command. If you want to change the "poll completed" delay, then adjust `pollCompleteDelay` at the top of `App.tsx`- yeah the whole app is in one file, deal with it. 

In OBS, new browser source, then for the URL make sure to inlude `?channel=YOUR_TWITCH_CHANNEL` replacing YOUR_TWITCH_CHANNEL with your twitch channel. Kappa. Set size to like 400x400, whatever you want. 

![image](https://github.com/user-attachments/assets/ab91b5ed-ed3b-40ca-a4fa-a3db855ae49d)
