import json
import luadata
import re

import subprocess

ranks = [
	"IRON",
	"BRONZE",
	"SILVER",
	"GOLD",
	"PLATINUM",
	"DIAMOND",
	"MASTER",
	"GRANDMASTER",
	"CHALLENGER",
]

def examine_challenge(challenge_id, challenge_data, ret):
	audit = ret.get("audit", [])
	source_list = ret.get("source_list", {})
	queue_id_list = ret.get("queue_id_list", {})
	tags_list = ret.get("tags_list", {})
	priorities_list = ret.get("priorities_list", {})
	reward_cat_list = ret.get("reward_cat_list", {})
	reward_quantity_list = ret.get("reward_quantity_list", {})
	leaderboard_outlier_list = ret.get("leaderboard_outlier_list", [])
	ret["audit"] = audit
	ret["source_list"] = source_list
	ret["queue_id_list"] = queue_id_list
	ret["tags_list"] = tags_list
	ret["priorities_list"] = priorities_list
	ret["reward_cat_list"] = reward_cat_list
	ret["reward_quantity_list"] = reward_quantity_list
	ret["leaderboard_outlier_list"] = leaderboard_outlier_list
	if "reverseDirection" in challenge_data:
		# if challenge_data["reverseDirection"] == True:
		# 	audit.append(challenge_id)
		pass
	if "thresholds" in challenge_data:
		thresholds = challenge_data["thresholds"]
		if ("CHALLENGER" in challenge_data["thresholds"] or "GRANDMASTER" in challenge_data["thresholds"]) and "leaderboard" in challenge_data and challenge_data["leaderboard"] == False:
			leaderboard_outlier_list.append(challenge_id)
		if ("CHALLENGER" not in challenge_data["thresholds"] and "GRANDMASTER" not in challenge_data["thresholds"]) and "leaderboard" in challenge_data and challenge_data["leaderboard"] == True:
			leaderboard_outlier_list.append(challenge_id)

		for rank in ranks:
			if rank in thresholds and "rewards" in thresholds[rank]:
				for reward in thresholds[rank]["rewards"]:
					if "category" in reward:
						cat = reward["category"]
						reward_cat_list[cat] = reward_cat_list.get(cat, 0) + 1
					if "quantity" in reward:
						quant = reward["quantity"]
						reward_quantity_list[quant] = reward_quantity_list.get(quant, 0) + 1
	# check if all challenges that source form challenges are capstone challenges
	# if "source" in challenge_data and "tags" in challenge_data and "isCapstone" in challenge_data["tags"]:
	# 	if challenge_data["tags"]["isCapstone"] == "Y" and challenge_data["source"] != "CHALLENGES":
	# 		audit.append(challenge_id)
	# 	if challenge_data["source"] == "CHALLENGES" and challenge_data["tags"]["isCapstone"] != "Y":
	# 		audit.append(challenge_id)
	if "source" in challenge_data:
		# source_list[source] = source_list.get(source, 0) + 1
		pass
	if "queueIds" in challenge_data:
		qids = challenge_data["queueIds"]
		# if 422 in qids and 420 not in qids:
		# 	audit.append(challenge_id)
		if 440 in qids and 400 not in qids:
			audit.append(challenge_id)
		if 442 in qids and 400 not in qids:
			audit.append(challenge_id)
		# if 400 in qids and 700 not in qids:
		# 	audit.append(challenge_id)
		for qid in challenge_data["queueIds"]:
			queue_id_list[qid] = queue_id_list.get(qid, 0) + 1
	if "tags" in challenge_data:
		for tag in challenge_data["tags"]:
			tags_list[tag] = tags_list.get(tag, 0) + 1
			if tag == "priority":
				prio = challenge_data["tags"]["priority"]
				priorities_list[prio] = priorities_list.get(prio, 0) + 1

def process_challenge(challenge_id, challenge_data):
	challenge_data["id"] = int(challenge_id)
	if "levelToIconPath" in challenge_data:
		del challenge_data["levelToIconPath"]
	if "reverseDirection" in challenge_data:
		del challenge_data["reverseDirection"]
	if "thresholds" in challenge_data:
		new_thresholds = {}
		new_rewards = []
		thresholds = challenge_data["thresholds"]
		for rank in ranks:
			if rank in thresholds and "value" in thresholds[rank]:
				new_thresholds[rank] = int(thresholds[rank]["value"])
			if rank in thresholds and "rewards" in thresholds[rank]:
				for reward in thresholds[rank]["rewards"]:
					if "id" in reward:
						new_rewards.append({"rank": rank.title(), "title": data["titles"][reward["id"]]["name"]})
		challenge_data["thresholds"] = new_thresholds
		if len(new_rewards) > 0:
			challenge_data["rewards"] = new_rewards
		if "tags" in challenge_data and "valueMapping" in challenge_data["tags"] and challenge_data["tags"]["valueMapping"] == "tierNames":
			# handle ranked ladder tier numbers that count down instead of up
			# for i in range(len(challenge_data["thresholds"])):
			# 	if challenge_data["thresholds"][i] >= 0:
			# 		challenge_data["thresholds"][i] = ranks[8 - int(challenge_data["thresholds"][i])].title()
			pass
	if "source" in challenge_data:
		source = challenge_data["source"]
		if source == "SUMMONER":
			pass
		if source == "EOGD":
			pass
		if source == "CHALLENGES":
			challenge_data["capstone"] = True
	if "queueIds" in challenge_data:
		qids = challenge_data["queueIds"]
		if 400 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["SR 5v5 Draft Pick"] = True
		# game mode deprecated in patch 6.22
		# if 410 in qids:
		# 	challenge_data["modes"] = challenge_data.get("modes", {})
		# 	challenge_data["modes"]["SR 5v5 Ranked Dynamic"] = True
		if 420 in qids or 422 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["SR 5v5 Ranked Solo"] = True
		if 430 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["SR 5v5 Blind Pick"] = True			
		if 440 in qids or 442 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["SR 5v5 Ranked Flex"] = True
		if 450 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["ARAM"] = True
		if 700 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["Clash"] = True			
		if 830 in qids:
			challenge_data["modes"] = challenge_data.get("modes", {})
			challenge_data["modes"]["Co-op vs AI"] = True
		del challenge_data["queueIds"]
	if "tags" in challenge_data:
		for tag in challenge_data["tags"]:
			if tag == "parent":
				challenge_data["group"] = data["challenges"][challenge_data["tags"][tag]]["name"]
		del challenge_data["tags"]
	if int(challenge_id) > 600000 and "group" not in challenge_data:
		challenge_data["group"] = "Legacy"
	return
	

if __name__ == "__main__":
	with open('challenges.json') as f:
		data = json.load(f)
	with open('challenges_pretty.json', 'w') as f:
		f.write(json.dumps(data, indent=4))
	# examine the data and print info about the data
	print(data.keys())
	examine_results = {}
	for challenge_id in data["challenges"]:
		examine_challenge(challenge_id, data["challenges"][challenge_id], examine_results)
	for key in examine_results:
		print(key, " : ", examine_results[key])

	# modify the data
	for i in range(0,6):
		data["challenges"][str(i)]["name"] = data["challenges"][str(i)]["name"].title()
	for challenge_id in data["challenges"]:
		process_challenge(challenge_id, data["challenges"][challenge_id])
	temp = {}
	for challenge_id in data["challenges"].keys():
		temp[challenge_id] = True
	for challenge_id in temp:
		data["challenges"][int(challenge_id)] = data["challenges"][challenge_id]
		del data["challenges"][challenge_id]

	# challenge categories
	# del data["challenges"][0]
	# del data["challenges"][1]
	# del data["challenges"][2]
	# del data["challenges"][3]
	# del data["challenges"][4]
	# del data["challenges"][5]

	# write data to files
	# - json
	# with open('new_challenges.json', 'w') as f:
	# 	f.write(json.dumps(data["challenges"]))
	# with open('new_challenges_pretty.json', 'w') as f:
	# 	f.write(json.dumps(data["challenges"], indent=4))
	# - lua
	lua_string = luadata.serialize(data["challenges"], encoding="utf-8", indent="\t", indent_level=0)
	lua_string = re.sub(r'(\w+) =', r'["\1"] =', lua_string)
	lua_string = re.sub(r'(?:<em>)|(?:</em>)', r"''", lua_string)
	lua_string = "return " + lua_string 
	with open('new_challenges.lua', 'w') as f:
		f.write(lua_string)

	with open('new_challenges_ro.lua', 'w') as out:
		subprocess.run(['lua', '-l' , 'reorder', '-e' , 'print(p.reorderDataModule("challenges", require("new_challenges")))'], stdout=out.fileno())
