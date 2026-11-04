using FluentAssertions;
using LearnOnline.Services.Assistant;

namespace LearnOnline.Tests.Assistant;

public class ReplyValidatorTests
{
    private static string Json(string message, string? question = null) =>
        System.Text.Json.JsonSerializer.Serialize(new { message, question });

    [Fact]
    public void Valid_reply_passes()
    {
        var r = ReplyValidator.Validate(Json("Hello **there**", "Which course?"));
        r.IsValid.Should().BeTrue();
        r.Reply!.Message.Should().Be("Hello **there**");
        r.Reply.Question.Should().Be("Which course?");
    }

    [Fact]
    public void Null_question_and_missing_question_are_ok()
    {
        ReplyValidator.Validate("{\"message\":\"Hi\",\"question\":null}").IsValid.Should().BeTrue();
        ReplyValidator.Validate("{\"message\":\"Hi\"}").Reply!.Question.Should().BeNull();
    }

    [Fact]
    public void Code_fenced_json_is_accepted()
    {
        ReplyValidator.Validate("```json\n{\"message\":\"Hi\",\"question\":null}\n```").IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("not json at all")]
    [InlineData("{\"message\": ")]
    [InlineData("")]
    [InlineData("[1,2]")]
    [InlineData("\"just a string\"")]
    public void Malformed_or_non_object_json_fails(string raw)
    {
        var r = ReplyValidator.Validate(raw);
        r.IsValid.Should().BeFalse();
        r.Errors.Should().NotBeEmpty();
    }

    [Fact]
    public void Missing_message_fails()
    {
        var r = ReplyValidator.Validate("{\"question\":null}");
        r.IsValid.Should().BeFalse();
        r.Errors.Should().Contain(e => e.Contains("missing"));
    }

    [Fact]
    public void Wrong_types_fail()
    {
        ReplyValidator.Validate("{\"message\":5}").IsValid.Should().BeFalse();
        ReplyValidator.Validate("{\"message\":\"a\",\"question\":7}").IsValid.Should().BeFalse();
    }

    [Fact]
    public void Empty_message_fails()
    {
        ReplyValidator.Validate(Json("   ")).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Message_over_6000_chars_fails_and_6000_passes()
    {
        ReplyValidator.Validate(Json(new string('a', 6001))).IsValid.Should().BeFalse();
        ReplyValidator.Validate(Json(new string('a', 6000))).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Message_with_guid_fails()
    {
        var r = ReplyValidator.Validate(Json($"Your id is {Guid.NewGuid()}"));
        r.IsValid.Should().BeFalse();
        r.Errors.Should().Contain(e => e.Contains("GUID"));
    }

    [Fact]
    public void Empty_question_fails()
    {
        ReplyValidator.Validate(Json("Hi", "  ")).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Question_without_question_mark_fails()
    {
        ReplyValidator.Validate(Json("Hi", "Tell me more")).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Question_over_240_chars_fails()
    {
        ReplyValidator.Validate(Json("Hi", new string('a', 240) + "?")).IsValid.Should().BeFalse();
        ReplyValidator.Validate(Json("Hi", new string('a', 239) + "?")).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Question_with_newline_fails()
    {
        ReplyValidator.Validate(Json("Hi", "One\nTwo?")).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Multiple_problems_are_all_reported()
    {
        var r = ReplyValidator.Validate(Json(" ", "no mark"));
        r.Errors.Count.Should().BeGreaterThan(1);
    }

    [Fact]
    public void Valid_reply_has_repeated_question_stripped()
    {
        var r = ReplyValidator.Validate(Json("Do the lab first.\n\nWhich course is this?", "Which course is this?"));
        r.Reply!.Message.Should().Be("Do the lab first.");
        r.Reply.Question.Should().Be("Which course is this?");
    }

    [Fact]
    public void WithoutRepeatedQuestion_is_case_whitespace_punctuation_insensitive()
    {
        ReplyValidator.WithoutRepeatedQuestion("Answer here. **WHICH   course** is this??", "Which course is this?")
            .Should().Be("Answer here.");
    }

    [Fact]
    public void WithoutRepeatedQuestion_leaves_message_when_question_not_at_end()
    {
        var msg = "Which course is this? Anyway, here is the answer.";
        ReplyValidator.WithoutRepeatedQuestion(msg, "Which course is this?").Should().Be(msg);
    }

    [Fact]
    public void WithoutRepeatedQuestion_does_not_cut_mid_word()
    {
        var msg = "Answer. Xwhich course?";
        ReplyValidator.WithoutRepeatedQuestion(msg, "which course?").Should().Be(msg);
    }

    [Fact]
    public void WithoutRepeatedQuestion_handles_null_question()
    {
        ReplyValidator.WithoutRepeatedQuestion("Hello", null).Should().Be("Hello");
    }
}
