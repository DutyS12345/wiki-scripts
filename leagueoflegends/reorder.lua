-- <nowiki>
p = {}
local ro = {}

function p.reorderDataModule(name, data)
    if data == nil then return end
    return ro["reorder_" .. name](data)
end

function ro.reorder_challenges(data)
	local ordering = {
		[2] = {
			[1] = {
				[1] = "id",
				[2] = "name",
				[3] = "group",
				[4] = "description",
				[5] = "descriptionShort",
				[6] = "source",
				[7] = "capstone",
				[8] = "leaderboard",
				[9] = "thresholds",
				[10] = "rewards",
				[11] = "modes",
			},
			["thresholds"] = {
				[1] = {
					"IRON",
					"BRONZE",
					"SILVER",
					"GOLD",
					"PLATINUM",
					"DIAMOND",
					"MASTER",
					"GRANDMASTER",
					"CHALLENGER",
				}
			}
		},
	}
	local retstring = p.reorder{data, ordering}
	retstring = retstring:gsub("(\t\t\t)%[%d+%] = ", "%1")
	retstring = "return " .. retstring
	-- retstring = "<pre>" .. mw.text.nowiki(retstring) .. "</pre>"
	return retstring
end

function p.reorder(args)
	local t = args[1] or nil
	local o = args[2] or nil
	local prettystring = luaprettyprint(t, o)
	prettystring = prettystring:gsub(",\n$", "")
	return prettystring
end

function luaprettyprint(t, ordering, level)
	local ret = {}
	luaprettyprint_h(t, ordering, level or 0, ret, 0)
	return table.concat(ret, "")
end

function luaprettyprint_h(t, ordering, level, ret, retn)
	retn = retn + 1
	ret[retn] = "{\n"
	local orderedComplete = {}
	for _, k in ipairs(ordering and ordering[1] or {}) do
		retn = luaprettyprint_hkv(t, ordering and ordering[k] or nil, level + 1, ret, retn, k)
		orderedComplete[k] = true
	end
	local sorted = {}
	for k, v in pairs(t) do
		if orderedComplete[k] then else
			table.insert(sorted, k)
		end
	end
	table.sort(sorted)
	for _, k in ipairs(sorted) do
		retn = luaprettyprint_hkv(t, ordering and ordering[2] or nil, level + 1, ret, retn, k)
	end
	for i = 1,level do
		ret[retn + i] = "\t"
	end
	retn = retn + level + 1
	ret[retn] = "},\n"
	return retn
end

function luaprettyprint_hkv(t, ordering, level, ret, retn, k)
	local k_type = type(k)
	local v_type = type(t[k])
	if v_type == "nil" then
		return retn
	end
	for i = 1,level do
		ret[retn + i] = "\t"
	end
	retn = retn + level
	if k_type == "number" then
		retn = retn + 1
		ret[retn] = '[' .. k .. '] = '
	elseif k_type == "string" then
		retn = retn + 1
		ret[retn] = '["' .. k:gsub('"', '\\"') .. '"] = '
	elseif k_type == "nil" then
	elseif k_type == "table" then
	elseif k_type == "function" then
	end
	if v_type == "number" then
		retn = retn + 1
		ret[retn] = t[k] .. ',\n'
	elseif v_type == "string" then
		retn = retn + 1
		ret[retn] = '"' .. t[k]:gsub('"', '\\"') .. '",\n'
	elseif v_type == "nil" then
	elseif v_type == "table" then
		retn = luaprettyprint_h(t[k], ordering, level, ret, retn)
	elseif v_type == "boolean" then
		retn = retn + 1
		ret[retn] = tostring(t[k]) .. ',\n'
	elseif v_type == "function" then
	else
	end
	return retn
end

-- </nowiki>


